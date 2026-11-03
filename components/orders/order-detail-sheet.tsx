"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { env } from "@/lib/env-client"
import { formatMoney } from "@/lib/format/money"
import {
  TRANSITIONS,
  TRANSITION_LABELS,
  formatAge,
  orderTypeLabel,
  statusLabel,
  statusVariant,
  type KDSOrder,
  type OrderStatus,
} from "@/lib/kds/types"

interface OrderDetailSheetProps {
  order: KDSOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransition: (orderId: string, status: OrderStatus) => void
  /** When false, the lifecycle actions are hidden for read-only roles. */
  canTransition?: boolean
  /** Disables the action buttons while a transition is in flight. */
  pending?: boolean
}

export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  onTransition,
  canTransition = true,
  pending = false,
}: OrderDetailSheetProps) {
  const currency = env.NEXT_PUBLIC_DEFAULT_CURRENCY
  const transitions = order ? (TRANSITIONS[order.status] ?? []) : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {order ? (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono">
                #{order.id.slice(0, 8)}
              </SheetTitle>
              <SheetDescription>
                {orderTypeLabel(order.orderType)}
                {order.tableLabel
                  ? ` · Table ${order.tableLabel}`
                  : order.tableId
                    ? ` · Table #${order.tableId.slice(0, 8)}`
                    : ""}
                {` · ${formatAge(order.occurredAt)}`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <Badge variant={statusVariant(order.status)}>
                  {statusLabel(order.status)}
                </Badge>
                <span className="text-lg font-semibold">
                  {formatMoney(order.totalAmount, currency)}
                </span>
              </div>

              {order.items.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  Item lines are not available yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {order.items.map((item, index) => (
                    <li
                      key={`${item.menuItemId}-${index}`}
                      className="rounded-lg border bg-muted/30 p-2.5"
                    >
                      <div className="flex items-start justify-between gap-3 text-sm">
                        <span className="font-medium">
                          {item.quantity}× {item.name}
                        </span>
                        <span className="shrink-0">
                          {formatMoney(
                            item.unitPrice * item.quantity,
                            currency
                          )}
                        </span>
                      </div>
                      {item.modifiers.length > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.modifiers
                            .map(
                              (modifier) =>
                                `${modifier.name} +${formatMoney(
                                  modifier.extraPrice,
                                  currency
                                )}`
                            )
                            .join(" · ")}
                        </p>
                      ) : null}
                      {item.notes ? (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          “{item.notes}”
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {order.items.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {order.items.reduce(
                    (total, item) => total + item.quantity,
                    0
                  )}{" "}
                  item
                  {order.items.reduce(
                    (total, item) => total + item.quantity,
                    0
                  ) === 1
                    ? ""
                    : "s"}{" "}
                  on this ticket. Totals include modifiers and tax.
                </p>
              ) : null}
            </div>

            {!canTransition ? (
              <p className="border-t p-4 text-sm text-muted-foreground">
                Your role can view this ticket but cannot move it.
              </p>
            ) : transitions.length > 0 ? (
              <div className="border-t bg-muted/30 p-4">
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Move ticket
                </p>
                <div className="flex flex-wrap gap-2">
                  {transitions.map((next) => (
                    <Button
                      key={next}
                      variant={next === "cancelled" ? "destructive" : "default"}
                      disabled={pending}
                      onClick={() => {
                        onTransition(order.id, next)
                        onOpenChange(false)
                      }}
                    >
                      {TRANSITION_LABELS[next]}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="border-t p-4 text-sm text-muted-foreground">
                This ticket is closed — no further transitions.
              </p>
            )}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
