import "server-only"

import { apiFetch } from "@/lib/api/client"

export interface Promotion {
  id: string
  tenant_id: string
  code: string
  description: string | null
  discount_type: "percentage" | "flat"
  discount_value: string
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
}

export interface CreatePromotionInput {
  code: string
  description?: string | null
  discountType: "percentage" | "flat"
  discountValue: number
  startsAt?: string | null
  endsAt?: string | null
  isActive?: boolean
}

export interface UpdatePromotionInput extends Partial<CreatePromotionInput> {
  discountType?: "percentage" | "flat"
}

export interface ApplyPromotionResult {
  promotionId: string
  code: string
  discountType: string
  subtotal: number
  discountAmount: number
  total: number
}

export function listPromotionsRequest(
  activeOnly?: boolean
): Promise<Promotion[]> {
  const query = activeOnly ? "?activeOnly=true" : ""
  return apiFetch<Promotion[]>(`/promotions${query}`)
}

export function getPromotionRequest(id: string): Promise<Promotion> {
  return apiFetch<Promotion>(`/promotions/${id}`)
}

export function createPromotionRequest(
  input: CreatePromotionInput
): Promise<Promotion> {
  return apiFetch<Promotion>("/promotions", { method: "POST", body: input })
}

export function updatePromotionRequest(
  id: string,
  input: UpdatePromotionInput
): Promise<Promotion> {
  return apiFetch<Promotion>(`/promotions/${id}`, {
    method: "PATCH",
    body: input,
  })
}

export function applyPromotionRequest(
  code: string,
  subtotal: number
): Promise<ApplyPromotionResult> {
  return apiFetch<ApplyPromotionResult>("/promotions/apply", {
    method: "POST",
    body: { code, subtotal },
  })
}

export function announcePromotionRequest(
  id: string,
  customerIds?: string[]
): Promise<{ promotionId: string; code: string; published: number }> {
  return apiFetch<{ promotionId: string; code: string; published: number }>(
    `/promotions/${id}/announce`,
    { method: "POST", body: customerIds ? { customerIds } : {} }
  )
}
