import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  getOrderRequest,
  enrichOrderWithTableLabel,
} from "@/lib/api/endpoints/orders"
import { can } from "@/lib/auth/rbac"
import { requireBranchAccess } from "@/lib/auth/session"
import { env } from "@/lib/env"
import { formatMoney } from "@/lib/format/money"
import { orderTypeLabel, statusLabel, statusVariant } from "@/lib/kds/types"

import { OrderTransitionSelect } from "../order-transition-select"

interface OrderDetailPageProps {
  params: Promise<{ branchId: string; orderId: string }>
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { branchId, orderId } = await params
  const { session } = await requireBranchAccess(branchId)
  const canTransition = can(session.role, "transitionOrder")
  const rawOrder = await getOrderRequest(orderId)
  const order = await enrichOrderWithTableLabel(rawOrder, branchId)

  const currency = env.NEXT_PUBLIC_DEFAULT_CURRENCY

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href={`/b/${branchId}/orders`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to orders
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Order {order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {orderTypeLabel(order.orderType)} ·{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Link
          href={`/b/${branchId}/orders/new`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          New order
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-2">
            <Badge variant={statusVariant(order.status)}>
              {statusLabel(order.status)}
            </Badge>
          </div>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">Table</p>
          <p className="mt-1 font-mono text-sm font-medium">
            {order.tableLabel
              ? order.tableLabel
              : order.tableId
                ? `#${order.tableId.slice(0, 8)}`
                : "—"}
          </p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-1 text-sm font-semibold">
            {formatMoney(order.totalAmount, currency)}
          </p>
        </div>
      </div>

      {canTransition ? (
        <div className="rounded-xl border bg-background p-4">
          <h2 className="text-sm font-semibold">Change status</h2>
          <div className="mt-3">
            <OrderTransitionSelect
              orderId={order.id}
              branchId={branchId}
              currentStatus={order.status}
            />
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Items</h2>
        </div>
        {order.items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Item lines are not available for this order.
          </p>
        ) : (
          <ul className="divide-y">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.menuItemName}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-xs text-muted-foreground italic">
                      “{item.notes}”
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-medium">
                  {formatMoney(Number(item.price) * item.quantity, currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-1 border-t px-4 py-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium">
              {formatMoney(order.subtotal, currency)}
            </span>
          </div>
          {Number(order.taxAmount) > 0 ? (
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span className="font-medium">
                {formatMoney(order.taxAmount, currency)}
              </span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between border-t pt-2 text-lg font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.totalAmount, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
