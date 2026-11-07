import "server-only"

import { ApiError, parseApiError } from "@/lib/api/errors"
import { env } from "@/lib/env"

export interface OnboardingInput {
  orgName: string
  slug: string
  planId?: string
  firstBranch: { name: string; address?: string | null }
  defaultTables?: number
  owner: { email: string; password: string }
}

export interface OnboardingResult {
  tenantId: string
  slug: string
  branchId: string
  tableIds: string[]
  ownerUserId: string
}

export async function onboardRequest(
  input: OnboardingInput
): Promise<OnboardingResult> {
  const base = env.API_BASE_URL.replace(/\/$/, "")

  const response = await fetch(`${base}/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  return (await response.json()) as OnboardingResult
}
