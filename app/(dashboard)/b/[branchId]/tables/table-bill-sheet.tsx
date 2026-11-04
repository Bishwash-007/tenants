"use client"

import { useCallback, useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

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
import { type KDSOrderItem } from "@/lib/kds/types"
import type { Bill, BillCheckoutResult } from "@/lib/api/endpoints/bills"

import { checkoutBillAction, prepareBillForTableAction } from "./bill-actions"

interface TableBillSheetProps {
  branchId: string
  tableId: string
  tableLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PaymentStatus = "idle" | "pending" | "succeeded" | "failed"

export function TableBillSheet({
  branchId,
  tableId,
  tableLabel,
  open,
  onOpenChange,
}: TableBillSheetProps) {
  const currency = env.NEXT_PUBLIC_DEFAULT_CURRENCY
  const [bill, setBill] = useState<Bill | null>(null)
  const [orderItems, setOrderItems] = useState<Record<string, KDSOrderItem[]>>(
    {}
  )
  const [error, setError] = useState<string | null>(null)
  const [checkout, setCheckout] = useState<BillCheckoutResult | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const [polling, setPolling] = useState(false)

  const loading = bill === null && error === null && checkout === null

  const loadBill = useCallback(async () => {
    const result = await prepareBillForTableAction(branchId, tableId)
    if (result.ok === false) {
      setError(result.message)
      return
    }
    setBill(result.bill)
    const entries = await Promise.all(
      result.bill.orders.map(async (order) => {
        try {
          const response = await fetch(`/api/kds/orders/${order.orderId}`)
          if (!response.ok) return [order.orderId, []] as const
          const data = (await response.json()) as { items?: KDSOrderItem[] }
          return [order.orderId, data.items ?? []] as const
        } catch {
          return [order.orderId, []] as const
        }
      })
    )
    setOrderItems(Object.fromEntries(entries))
  }, [branchId, tableId])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      void loadBill()
    }, 0)
    return () => clearTimeout(timer)
  }, [open, loadBill])

  useEffect(() => {
    if (!checkout || !polling) return

    const orderId = checkout.qr.orderId
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/order/${orderId}`)
        if (!response.ok) return
        const payments = (await response.json()) as Array<{
          status: string
        }>
        const latest = payments[0]
        if (latest?.status === "succeeded") {
          setPaymentStatus("succeeded")
          setPolling(false)
          toast.success("Payment received.")
        } else if (latest?.status === "failed") {
          setPaymentStatus("failed")
          setPolling(false)
          toast.error("Payment failed.")
        }
      } catch {
        // ignore transient polling errors
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [checkout, polling])

  async function handleCheckout() {
    if (!bill) return
    const result = await checkoutBillAction(bill.billId)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    setCheckout(result.result)
    setPaymentStatus("pending")
    setPolling(true)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="!w-1/2 max-w-none">
        <SheetHeader>
          <SheetTitle>Bill · {tableLabel}</SheetTitle>
          <SheetDescription>
            Combine open orders for this table and check out once.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Preparing bill…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : bill ? (
            <>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {formatMoney(bill.subtotal, currency)}
                  </span>
                </div>
                {bill.taxAmount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span className="font-medium">
                      {formatMoney(bill.taxAmount, currency)}
                    </span>
                  </div>
                ) : null}
                {bill.discountAmount > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span>Discount</span>
                    <span className="font-medium">
                      {formatMoney(bill.discountAmount, currency)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-2 flex justify-between border-t pt-2 text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(bill.totalAmount, currency)}</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Orders in this bill
                </p>
                <ul className="space-y-3">
                  {bill.orders.map((order) => {
                    const items = orderItems[order.orderId] ?? []
                    return (
                      <li
                        key={order.orderId}
                        className="rounded-lg border bg-background p-3 text-sm"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs">
                              #{order.orderId.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.status}
                            </p>
                          </div>
                          <span className="font-medium">
                            {formatMoney(order.totalAmount, currency)}
                          </span>
                        </div>
                        {items.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Loading items…
                          </p>
                        ) : (
                          <ul className="space-y-1 border-t pt-2">
                            {items.map((item, index) => (
                              <li
                                key={`${item.menuItemId}-${index}`}
                                className="flex items-start justify-between gap-3 text-xs"
                              >
                                <span>
                                  {item.quantity}× {item.name}
                                  {item.notes ? (
                                    <span className="ml-1 text-muted-foreground italic">
                                      ({item.notes})
                                    </span>
                                  ) : null}
                                </span>
                                <span className="shrink-0">
                                  {formatMoney(
                                    item.unitPrice * item.quantity,
                                    currency
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>

              {checkout ? (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Checkout
                  </p>
                  <div className="flex justify-center">
                    <QRCodeSVG value={checkout.qr.data} size={160} />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    {checkout.qr.provider} ·{" "}
                    {formatMoney(checkout.qr.amount, currency)}
                  </p>
                  <p className="text-center text-sm font-medium">
                    {paymentStatus === "succeeded"
                      ? "Paid"
                      : paymentStatus === "failed"
                        ? "Failed"
                        : "Awaiting payment…"}
                  </p>
                  {checkout.qr.data.startsWith("http") ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(checkout.qr.data, "_blank")}
                    >
                      Open checkout link
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="border-t p-4">
          {!checkout && bill ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.print()}
              >
                Print
              </Button>
              <Button className="flex-1" onClick={handleCheckout}>
                Checkout — {formatMoney(bill.totalAmount, currency)}
              </Button>
            </div>
          ) : checkout ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
