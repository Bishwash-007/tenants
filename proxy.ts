import { NextResponse, type NextRequest } from "next/server"

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  TENANT_COOKIE,
} from "@/lib/auth/constants"
import { getTenantSlugFromHost } from "@/lib/auth/tenant"

const TENANT_HEADER = "x-tenant-slug"
const PATHNAME_HEADER = "x-pathname"

function rootDomain(): string {
  return process.env.DASHBOARD_ROOT_DOMAIN ?? "localhost"
}

function isPageRequest(pathname: string): boolean {
  return !pathname.startsWith("/api")
}

function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/")
}

function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null
  }

  return value
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  const tenantSlug = getTenantSlugFromHost(host, rootDomain())
  const tenantCookie = request.cookies.get(TENANT_COOKIE)?.value ?? null
  const nextPath = safeNextPath(`${pathname}${search}`)

  requestHeaders.set(PATHNAME_HEADER, `${pathname}${search}`)

  // Never trust a client-supplied tenant header.
  requestHeaders.delete(TENANT_HEADER)

  if (tenantSlug) {
    requestHeaders.set(TENANT_HEADER, tenantSlug)
  }

  // A session from tenant A must not be usable on tenant B's subdomain.
  if (
    tenantSlug &&
    tenantCookie &&
    tenantSlug !== tenantCookie &&
    isPageRequest(pathname)
  ) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("tenant", tenantSlug)

    if (nextPath && !isAuthPage(pathname)) {
      loginUrl.searchParams.set("next", nextPath)
    }

    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete(ACCESS_COOKIE)
    response.cookies.delete(REFRESH_COOKIE)
    response.cookies.delete(TENANT_COOKIE)
    return response
  }

  if (isPageRequest(pathname) && !isAuthPage(pathname)) {
    const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

    if (!accessToken && refreshToken) {
      const refreshUrl = new URL("/api/auth/refresh", request.url)

      if (nextPath) {
        refreshUrl.searchParams.set("next", nextPath)
      }

      return NextResponse.redirect(refreshUrl)
    }

    if (!accessToken && !refreshToken) {
      const loginUrl = new URL("/login", request.url)

      if (tenantSlug) {
        loginUrl.searchParams.set("tenant", tenantSlug)
      }

      if (nextPath) {
        loginUrl.searchParams.set("next", nextPath)
      }

      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    // Everything except Next internals and files with an extension.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}
