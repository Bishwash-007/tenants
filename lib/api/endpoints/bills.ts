import "server-only"

import { apiFetch } from "@/lib/api/client"

export interface BillOrder {
  orderId: string
  status: string
  totalAmount: number
  subtotal: number
  taxAmount?: number
  discountAmount?: number
}

export interface Bill {
  billId: string
  branchId: string
  tableId: string | null
  status: string
  orders: BillOrder[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
}

export interface BillCheckoutResult {
  payment: {
    id: string
    status: string
    amount: string | number
  }
  qr: {
    provider: string
    orderId: string
    amount: number
    format: string
    data: string
    expiresAt: string | null
  }
}

export interface PrepareBillInput {
  branchId: string
  tableId?: string | null
  orderIds?: string[] | null
}

export function prepareBillRequest(input: PrepareBillInput): Promise<Bill> {
  return apiFetch<Bill>("/bills/prepare", {
    method: "POST",
    body: input,
  })
}

export function getBillRequest(billId: string): Promise<Bill> {
  return apiFetch<Bill>(`/bills/${billId}`)
}

export function checkoutBillRequest(
  billId: string
): Promise<BillCheckoutResult> {
  return apiFetch<BillCheckoutResult>(`/payments/bills/${billId}/checkout`, {
    method: "POST",
  })
}
