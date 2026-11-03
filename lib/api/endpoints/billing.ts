import "server-only"

import { apiFetch } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"

export interface BillingPlan {
  id: string
  name: string
  priceMonthly: number
  maxBranches: number
  maxStaff: number
}

export interface BillingSubscription {
  id: string
  tenantId: string
  status: string
  startedAt: string | null
  endsAt: string | null
  plan: BillingPlan
  // The seeded tenants may not have a subscription row yet
}

export async function getBillingSubscriptionRequest(): Promise<BillingSubscription | null> {
  try {
    return await apiFetch<BillingSubscription>("/billing/subscription")
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}
