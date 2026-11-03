import { NextResponse } from "next/server"

import { clearSessionCookies, setSessionCookies } from "@/lib/auth/cookies"
import { getRefreshToken, getTenantCookie } from "@/lib/auth/cookies"
import { refreshSession } from "@/lib/auth/refresh"

function safeNextPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/api/auth")
  ) {
    return "/"
  }

  return value
}

async function rotateTokens(): Promise<{
  ok: boolean
  tenantSlug: string | null
}> {
  const refreshToken = await getRefreshToken()
  const tenantSlug = await getTenantCookie()

  if (!refreshToken || !tenantSlug) {
    await clearSessionCookies()
    return { ok: false, tenantSlug }
  }

  try {
    const result = await refreshSession(refreshToken, tenantSlug)

    await setSessionCookies({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tenantSlug,
    })

    return { ok: true, tenantSlug }
  } catch {
    await clearSessionCookies()
    return { ok: false, tenantSlug }
  }
}

export async function GET(request: Request) {
  const next = safeNextPath(new URL(request.url).searchParams.get("next"))
  const result = await rotateTokens()

  if (!result.ok) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("error", "session")

    if (result.tenantSlug) {
      loginUrl.searchParams.set("tenant", result.tenantSlug)
    }

    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(new URL(next, request.url))
}

export async function POST() {
  const result = await rotateTokens()

  if (!result.ok) {
    return NextResponse.json(
      { message: "Session expired. Please sign in again." },
      { status: 401 }
    )
  }

  return NextResponse.json({ ok: true })
}
