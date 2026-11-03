import "server-only"

import { cookies } from "next/headers"

import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  TENANT_COOKIE,
} from "@/lib/auth/constants"
import { env } from "@/lib/env"

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.SESSION_COOKIE_SECURE,
  path: "/",
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_COOKIE)?.value ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(REFRESH_COOKIE)?.value ?? null
}

export async function getTenantCookie(): Promise<string | null> {
  const store = await cookies()
  return store.get(TENANT_COOKIE)?.value ?? null
}

export async function setSessionCookies(input: {
  accessToken: string
  refreshToken: string
  tenantSlug: string
}): Promise<void> {
  const store = await cookies()

  store.set(ACCESS_COOKIE, input.accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE,
  })
  store.set(REFRESH_COOKIE, input.refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  })
  store.set(TENANT_COOKIE, input.tenantSlug, {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  })
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies()

  store.delete(ACCESS_COOKIE)
  store.delete(REFRESH_COOKIE)
  store.delete(TENANT_COOKIE)
}
