import "server-only"

import { apiFetch } from "@/lib/api/client"
import type { CurrentUser, LoginResponse } from "@/lib/api/types"

export function loginRequest(
  input: { email: string; password: string },
  tenant: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    token: null,
    tenant,
    body: input,
  })
}

export function refreshRequest(
  refreshToken: string,
  tenant: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/refresh", {
    method: "POST",
    token: null,
    tenant,
    body: { refreshToken },
  })
}

export function logoutRequest(input: {
  accessToken: string
  refreshToken: string
  tenant: string
}): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/auth/logout", {
    method: "POST",
    token: input.accessToken,
    tenant: input.tenant,
    body: { refreshToken: input.refreshToken },
  })
}

export function getCurrentUserRequest(
  accessToken: string,
  tenant: string
): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/auth/me", {
    token: accessToken,
    tenant,
  })
}
