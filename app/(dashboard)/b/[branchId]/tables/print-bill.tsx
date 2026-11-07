"use client"

import { createPortal } from "react-dom"

import { formatMoney } from "@/lib/format/money"
import type { KDSOrderItem } from "@/lib/kds/types"
import type { Bill } from "@/lib/api/endpoints/bills"

export interface PrintBranch {
  name: string
  address?: string | null
  phone?: string | null
}

interface PrintBillProps {
  branch: PrintBranch
  tableLabel: string
  bill: Bill
  orderItems: Record<string, KDSOrderItem[]>
  currency: string
  printedAt: Date
}

function lineTotal(item: KDSOrderItem): number {
  const modifierTotal = item.modifiers.reduce(
    (sum, modifier) => sum + modifier.extraPrice,
    0
  )
  return (item.unitPrice + modifierTotal) * item.quantity
}

function Divider() {
  return <div className="my-1.5 border-t border-dashed border-black" />
}

/**
 * Receipt laid out for paper only. It is portalled to `document.body` so the
 * `@media print` rules in globals.css can hide the app and the sheet while
 * leaving this node as the sole visible element.
 */
export function PrintBill({
  branch,
  tableLabel,
  bill,
  orderItems,
  currency,
  printedAt,
}: PrintBillProps) {
  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div
      id="bill-print-root"
      className="hidden bg-white font-mono text-[11px] leading-snug text-black"
    >
      <div className="mx-auto w-[80mm] max-w-full px-2 py-1">
        <header className="text-center">
          <h1 className="text-[15px] font-bold tracking-[0.12em] uppercase">
            {branch.name}
          </h1>
          {branch.address ? <p>{branch.address}</p> : null}
          {branch.phone ? <p>{branch.phone}</p> : null}
          <p className="mt-1 text-[10px] font-semibold tracking-[0.2em] uppercase">
            Combined bill
          </p>
        </header>

        <Divider />

        <div className="space-y-0.5">
          <div className="flex justify-between gap-3">
            <span>Bill</span>
            <span>#{bill.billId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Table</span>
            <span>{tableLabel}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Printed</span>
            <span>
              {printedAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>

        <Divider />

        {bill.orders.map((order) => {
          const items = orderItems[order.orderId] ?? []
          const quantity = items.reduce((sum, item) => sum + item.quantity, 0)
          return (
            <section key={order.orderId} className="mb-2 last:mb-0">
              <div className="flex justify-between gap-3 font-bold">
                <span>Order #{order.orderId.slice(0, 8).toUpperCase()}</span>
                <span>
                  {quantity} item{quantity === 1 ? "" : "s"}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="text-[10px] italic">Items unavailable</p>
              ) : (
                <ul className="mt-0.5">
                  {items.map((item, index) => (
                    <li key={`${item.menuItemId}-${index}`} className="mb-0.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0">
                          {item.quantity} × {item.name}
                          {item.modifiers.length > 0 ? (
                            <span className="text-[9px]">
                              {" "}
                              (
                              {item.modifiers
                                .map((modifier) => modifier.name)
                                .join(", ")}
                              )
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatMoney(lineTotal(item), currency)}
                        </span>
                      </div>
                      {item.notes ? (
                        <p className="pl-3 text-[9px] italic">
                          Note: {item.notes}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}

        <Divider />

        <div className="space-y-0.5">
          <div className="flex justify-between gap-3">
            <span>Subtotal</span>
            <span className="tabular-nums">
              {formatMoney(bill.subtotal, currency)}
            </span>
          </div>
          {bill.taxAmount > 0 ? (
            <div className="flex justify-between gap-3">
              <span>Tax</span>
              <span className="tabular-nums">
                {formatMoney(bill.taxAmount, currency)}
              </span>
            </div>
          ) : null}
          {bill.discountAmount > 0 ? (
            <div className="flex justify-between gap-3">
              <span>Discount</span>
              <span className="tabular-nums">
                −{formatMoney(bill.discountAmount, currency)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-1 flex justify-between gap-3 border-t border-black pt-1 text-[13px] font-bold">
          <span>Total</span>
          <span className="tabular-nums">
            {formatMoney(bill.totalAmount, currency)}
          </span>
        </div>

        <Divider />

        <p className="text-center text-[10px]">Thank you for visiting!</p>
        <p className="mt-0.5 text-center text-[9px]">
          Bill #{bill.billId.slice(0, 8).toUpperCase()} · {tableLabel}
        </p>
      </div>
    </div>,
    document.body
  )
}
