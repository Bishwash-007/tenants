"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { toast } from "sonner"

import { OrderDetailSheet } from "@/components/orders/order-detail-sheet"
import { OrderTicketsTable } from "@/components/orders/order-tickets-table"
import { env } from "@/lib/env-client"
import {
  STATUS_LABELS,
  orderTypeLabel,
  type KDSOrder,
  type KDSStatusChangedEvent,
  type OrderStatus,
} from "@/lib/kds/types"

interface KDSClientProps {
  branchId: string
  branchName: string
  /** Rendered on the server so the board has tickets before the socket opens. */
  initialOrders: KDSOrder[]
}

type ConnectionStatus = "connecting" | "connected" | "disconnected"

const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  connecting: "Connecting…",
  connected: "Live",
  disconnected: "Offline",
}

const CONNECTION_DOT_CLASSES: Record<ConnectionStatus, string> = {
  connecting: "bg-amber-500",
  connected: "bg-emerald-500",
  disconnected: "bg-destructive",
}

const TERMINAL_STATUSES: OrderStatus[] = ["completed", "cancelled"]

/** The BFF returns `{ message: string | string[] }` on failure. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      message?: string | string[]
    }

    if (Array.isArray(payload.message)) {
      return payload.message.join(". ")
    }

    return payload.message ?? `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export function KDSClient({
  branchId,
  branchName,
  initialOrders,
}: KDSClientProps) {
  const [orders, setOrders] = useState<KDSOrder[]>(initialOrders)
  const [refreshing, setRefreshing] = useState(false)
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting")
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)

  // Socket handlers and transitions are created once, so they read the latest
  // tickets through a ref instead of closing over a stale state value.
  const ordersRef = useRef<KDSOrder[]>([])
  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  const lastFetchErrorRef = useRef<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setRefreshing(true)

    try {
      const response = await fetch(`/api/kds/orders?branchId=${branchId}`)

      if (!response.ok) {
        throw new Error(await readErrorMessage(response))
      }

      const next = (await response.json()) as KDSOrder[]
      setOrders(next)
      lastFetchErrorRef.current = null
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load tickets."

      // A reconnect loop should not spam the same toast on every attempt.
      if (lastFetchErrorRef.current !== message) {
        lastFetchErrorRef.current = message
        toast.error(message)
      }
    } finally {
      setRefreshing(false)
    }
  }, [branchId])

  useEffect(() => {
    let mounted = true
    let socket: Socket | null = null
    let lastConnectionError: string | null = null

    const hydrate = async (event: KDSStatusChangedEvent) => {
      const fallback: KDSOrder = {
        id: event.orderId,
        branchId: event.branchId,
        status: event.newStatus,
        orderType: event.orderType,
        tableId: event.tableId,
        totalAmount: event.totalAmount,
        items: [],
        occurredAt: event.occurredAt,
      }

      try {
        const response = await fetch(`/api/kds/orders/${event.orderId}`)

        if (!response.ok) {
          throw new Error(await readErrorMessage(response))
        }

        const order = (await response.json()) as KDSOrder

        if (!mounted) return

        setOrders((current) =>
          current.some((candidate) => candidate.id === order.id)
            ? current.map((candidate) =>
                candidate.id === order.id
                  ? { ...order, status: event.newStatus }
                  : candidate
              )
            : [...current, { ...order, status: event.newStatus }]
        )
      } catch {
        // Keep the ticket on the board even without its lines; the sheet says
        // the items are unavailable instead of dropping a live order.
        if (!mounted) return

        setOrders((current) =>
          current.some((candidate) => candidate.id === fallback.id)
            ? current
            : [...current, fallback]
        )
      }
    }

    const handleStatusChanged = (event: KDSStatusChangedEvent) => {
      if (!mounted || event.branchId !== branchId) return

      if (TERMINAL_STATUSES.includes(event.newStatus)) {
        setOrders((current) =>
          current.filter((order) => order.id !== event.orderId)
        )
        return
      }

      const known = ordersRef.current.some(
        (order) => order.id === event.orderId
      )

      if (!known) {
        if (event.previousStatus === null) {
          toast.success(`New order #${event.orderId.slice(0, 8)}`, {
            description: `Placed · ${orderTypeLabel(event.orderType)}`,
          })
        }

        void hydrate(event)
        return
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === event.orderId
            ? {
                ...order,
                status: event.newStatus,
                tableId: event.tableId,
                orderType: event.orderType,
                totalAmount: event.totalAmount,
              }
            : order
        )
      )
    }

    const connect = () => {
      const nextSocket = io(`${env.NEXT_PUBLIC_API_BASE_URL}/kds`, {
        // Access tokens live 15 minutes, so every connection attempt (including
        // reconnects) must mint a fresh one rather than reuse a stale string.
        auth: (callback) => {
          fetch("/api/kds/token")
            .then(async (response) => {
              if (!response.ok) {
                throw new Error(await readErrorMessage(response))
              }

              const payload = (await response.json()) as { accessToken: string }
              callback({ token: payload.accessToken })
            })
            .catch((error: unknown) => {
              console.error("KDS token request failed:", error)
              callback({ token: "" })
            })
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      })

      nextSocket.on("connect", () => {
        if (!mounted) return

        setConnectionStatus("connected")
        lastConnectionError = null
        nextSocket.emit("kds:join", { branchId })

        // Events fired while the socket was down were never delivered, and the
        // gap between the server render and joining the room can also hide a
        // ticket, so the board reconciles against the API on every (re)connect.
        void fetchOrders()
      })

      nextSocket.io.on("reconnect_attempt", () => {
        if (!mounted) return
        setConnectionStatus("connecting")
      })

      nextSocket.on("disconnect", () => {
        if (!mounted) return
        setConnectionStatus("disconnected")
      })

      nextSocket.on("connect_error", (error: Error) => {
        if (!mounted) return

        setConnectionStatus("disconnected")

        if (lastConnectionError !== error.message) {
          lastConnectionError = error.message
          toast.error("Kitchen display disconnected", {
            description: error.message,
          })
        }
      })

      nextSocket.on("kds:joined", () => {
        // Nest emits the handler's response by name only, so this event arrives
        // with a null payload — never read `event.room` here.
        console.log("Joined KDS room for branch", branchId)
      })

      nextSocket.on("order.status_changed", handleStatusChanged)

      socket = nextSocket
    }

    connect()

    return () => {
      mounted = false
      if (socket) {
        socket.emit("kds:leave", { branchId })
        socket.removeAllListeners()
        socket.io.removeAllListeners()
        socket.disconnect()
      }
    }
  }, [branchId, fetchOrders])

  const handleTransition = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      const current = ordersRef.current
      const target = current.find((order) => order.id === orderId)

      if (!target || target.status === nextStatus) {
        return
      }

      const isTerminal = TERMINAL_STATUSES.includes(nextStatus)

      setOrders((previous) =>
        isTerminal
          ? previous.filter((order) => order.id !== orderId)
          : previous.map((order) =>
              order.id === orderId ? { ...order, status: nextStatus } : order
            )
      )

      try {
        const response = await fetch(`/api/kds/orders/${orderId}/transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        })

        if (!response.ok) {
          throw new Error(await readErrorMessage(response))
        }

        toast.success(`Order #${orderId.slice(0, 8)}`, {
          description: `Moved to ${STATUS_LABELS[nextStatus].toLowerCase()}.`,
        })

        // Without a live socket the optimistic update is the only confirmation,
        // so reconcile once the transition succeeds.
        if (connectionStatus !== "connected") {
          void fetchOrders()
        }
      } catch (error) {
        // Put the ticket back exactly where it was; the board must never claim
        // a transition the API rejected.
        setOrders((previous) => {
          const restored = previous.map((order) =>
            order.id === orderId ? target : order
          )

          return restored.some((order) => order.id === orderId)
            ? restored
            : [...previous, target]
        })

        toast.error(
          error instanceof Error ? error.message : "Could not move the ticket."
        )
      }
    },
    [connectionStatus, fetchOrders]
  )

  const openOrder =
    (openOrderId && orders.find((order) => order.id === openOrderId)) || null

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Kitchen display
          </h1>
          <p className="text-sm text-muted-foreground">
            {branchName} · {orders.length} active ticket
            {orders.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1">
          <span
            className={`inline-flex size-2 rounded-full ${CONNECTION_DOT_CLASSES[connectionStatus]}`}
            aria-hidden="true"
          />
          <span className="text-xs text-muted-foreground" role="status">
            {CONNECTION_LABELS[connectionStatus]}
          </span>
        </div>
      </div>

      <p className="rounded-xl border border-dashed bg-background p-3 text-sm text-muted-foreground">
        Tickets update live from the kitchen socket. Open a row to see its lines
        and move it through the order lifecycle — the board reconciles against
        the API whenever the connection returns.
      </p>

      <OrderTicketsTable
        orders={orders}
        refreshing={refreshing}
        onOpenOrder={setOpenOrderId}
        onRefresh={() => {
          void fetchOrders()
        }}
      />

      <OrderDetailSheet
        order={openOrder}
        open={openOrderId !== null && openOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenOrderId(null)
          }
        }}
        onTransition={(orderId, status) => {
          void handleTransition(orderId, status)
        }}
      />
    </div>
  )
}
