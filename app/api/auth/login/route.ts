import { NextResponse } from "next/server"

import { loginRequest } from "@/lib/api/endpoints/auth"
import { ApiError } from "@/lib/api/errors"
import { setSessionCookies } from "@/lib/auth/cookies"
import { isSameOrigin } from "@/lib/auth/origin"
import { loginSchema } from "@/lib/auth/schemas"
import { isValidTenantSlug } from "@/lib/auth/tenant"
import { env } from "@/lib/env"

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Cross-site request rejected" },
      { status: 403 }
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 }
    )
  }

  const parsed = loginSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 }
    )
  }

  const tenantSlug =
    parsed.data.tenantSlug ??
    request.headers.get("x-tenant-slug")?.trim() ??
    env.DEFAULT_TENANT_SLUG

  if (!tenantSlug || !isValidTenantSlug(tenantSlug)) {
    return NextResponse.json(
      { message: "A valid workspace is required" },
      { status: 400 }
    )
  }

  try {
    const result = await loginRequest(
      {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      tenantSlug
    )

    await setSessionCookies({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tenantSlug,
    })

    return NextResponse.json({ user: result.user })
  } catch (error) {
    if (error instanceof ApiError) {
      const headers = new Headers()

      if (error.retryAfter !== undefined) {
        headers.set("Retry-After", String(error.retryAfter))
      }

      return NextResponse.json(
        { message: error.messages, error: error.error },
        { status: error.status, headers }
      )
    }

    return NextResponse.json({ message: "Login failed" }, { status: 500 })
  }
}
