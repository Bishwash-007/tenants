import "server-only"

import { headers } from "next/headers"

import { getTenantCookie } from "@/lib/auth/cookies"
import { env } from "@/lib/env"

export const TENANT_HEADER = "x-tenant-slug"
export const PATHNAME_HEADER = "x-pathname"

/**
 * The tenant for the current request.
 *
 * Priority: proxy-resolved subdomain, login-slug cookie, local default.
 * The proxy always overwrites the incoming header, so clients cannot choose a
 * tenant by sending their own header.
 */
export async function getTenantSlug(): Promise<string | null> {
  const requestHeaders = await headers()
  const fromProxy = requestHeaders.get(TENANT_HEADER)?.trim()

  if (fromProxy) {
    return fromProxy
  }

  const fromCookie = await getTenantCookie()
  if (fromCookie) {
    return fromCookie
  }

  return env.DEFAULT_TENANT_SLUG ?? null
}

export async function getRequestPathname(): Promise<string | null> {
  const requestHeaders = await headers()
  return requestHeaders.get(PATHNAME_HEADER)
}
