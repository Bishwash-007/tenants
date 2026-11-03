import "server-only"

import { refreshRequest } from "@/lib/api/endpoints/auth"
import type { LoginResponse } from "@/lib/api/types"

/**
 * Refresh tokens rotate, so two concurrent refreshes with the same token can
 * invalidate each other. Single-flight them per process. Multi-instance
 * deployments need a shared lock; the Redis-backed API is the authority and
 * will reject a replayed refresh token.
 */
const inFlight = new Map<string, Promise<LoginResponse>>()

export function refreshSession(
  refreshToken: string,
  tenant: string
): Promise<LoginResponse> {
  const key = `${tenant}:${refreshToken}`
  const existing = inFlight.get(key)

  if (existing) {
    return existing
  }

  const request = refreshRequest(refreshToken, tenant).finally(() => {
    inFlight.delete(key)
  })

  inFlight.set(key, request)
  return request
}
