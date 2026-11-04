import "server-only"

import { apiFetch } from "@/lib/api/client"

export interface Payment {
  id: string
  status: string
  amount: string | number
  provider?: string
  createdAt?: string
}

export function listPaymentsForOrderRequest(
  orderId: string
): Promise<Payment[]> {
  return apiFetch<Payment[]>(`/payments/order/${orderId}`)
}

export function refundPaymentRequest(paymentId: string): Promise<unknown> {
  return apiFetch(`/payments/${paymentId}/refund`, { method: "POST" })
}
