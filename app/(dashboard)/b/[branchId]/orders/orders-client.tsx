"use client"

import { PlusIcon } from "@phosphor-icons/react"
import { useOptimistic, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { OrderDetailSheet } from "@/components/orders/order-detail-sheet"
import { OrderTicketsTable } from "@/components/orders/order-tickets-table"
import { STATUS_LABELS, type KDSOrder, type OrderStatus } from "@/lib/kds/types"

import { transitionOrderAction } from "./actions"

const TERMINAL_STATUSES: OrderStatus[] = ["completed", "cancelled"]

interface OptimisticOrderUpdate {
  orderId: string
  status: OrderStatus
}

interface OrdersClientProps {
  branchId: string
  branchName: string
  /** Normalized tickets rendered on the server, so the table is populated on first paint. */
  initialOrders: KDSOrder[]
  canTransition: boolean
  /** Whether the caller may create new orders (drives the "New order" button). */
  canCreate?: boolean
}

export function OrdersClient({
  branchId,
  branchName,
  initialOrders,
  canTransition,
  canCreate = false,
}: OrdersClientProps) {
  const router = useRouter()
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [refreshing, startRefresh] = useTransition()

  // Terminal orders leave the active list, so the optimistic reducer mirrors
  // what the server's active-orders query will return after the transition.
  const [orders, applyOptimisticOrder] = useOptimistic(
    initialOrders,
    (current, update: OptimisticOrderUpdate) => {
      if (TERMINAL_STATUSES.includes(update.status)) {
        return current.filter((order) => order.id !== update.orderId)
      }

      return current.map((order) =>
        order.id === update.orderId
          ? { ...order, status: update.status }
          : order
      )
    }
  )

  function handleTransition(orderId: string, nextStatus: OrderStatus) {
    setPendingOrderId(orderId)

    startTransition(async () => {
      applyOptimisticOrder({ orderId, status: nextStatus })

      try {
        const result = await transitionOrderAction(
          orderId,
          nextStatus,
          branchId
        )

        if (result.status === "error") {
          toast.error(result.message ?? "Could not move the order.")
          return
        }

        toast.success(`Order #${orderId.slice(0, 8)}`, {
          description: `Moved to ${STATUS_LABELS[nextStatus].toLowerCase()}.`,
        })

        // Re-render the server component so the optimistic list is replaced by
        // the API's view, including anything the optimistic reducer could not know.
        router.refresh()
      } catch {
        toast.error(
          "Could not move the order. Check your connection and retry."
        )
      } finally {
        setPendingOrderId(null)
      }
    })
  }

  function handleRefresh() {
    startRefresh(() => {
      router.refresh()
    })
  }

  const openOrder =
    (openOrderId && orders.find((order) => order.id === openOrderId)) || null

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {branchName} · {orders.length} active order
            {orders.length === 1 ? "" : "s"}
          </p>
        </div>
        {canCreate ? (
          <Button onClick={() => router.push(`/b/${branchId}/orders/new`)}>
            <PlusIcon data-icon="inline-start" />
            New order
          </Button>
        ) : null}
      </div>

      <p className="rounded-xl border border-dashed bg-background p-3 text-sm text-muted-foreground">
        Open an order to review its lines and move it through the lifecycle.
        Orders placed from the POS appear here as they are created.
      </p>

      <OrderTicketsTable
        orders={orders}
        refreshing={refreshing}
        onOpenOrder={setOpenOrderId}
        onRefresh={handleRefresh}
        emptyMessage="No active orders. Orders placed from the POS appear here."
      />

      <OrderDetailSheet
        order={openOrder}
        open={openOrderId !== null && openOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenOrderId(null)
          }
        }}
        onTransition={handleTransition}
        canTransition={canTransition}
        pending={pendingOrderId === openOrderId}
      />
    </div>
  )
}
