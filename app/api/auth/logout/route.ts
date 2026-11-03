import { NextResponse } from "next/server"

import { logoutRequest } from "@/lib/api/endpoints/auth"
import {
  clearSessionCookies,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/cookies"
import { isSameOrigin } from "@/lib/auth/origin"
import { getTenantSlug } from "@/lib/auth/request-context"

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Cross-site request rejected" },
      { status: 403 }
    )
  }

  const accessToken = await getAccessToken()
  const refreshToken = await getRefreshToken()
  const tenant = await getTenantSlug()

  if (accessToken && refreshToken && tenant) {
    try {
      await logoutRequest({ accessToken, refreshToken, tenant })
    } catch {
      // Clearing the local session is still the right outcome if the API is
      // unreachable or the token already expired.
    }
  }

  await clearSessionCookies()

  return NextResponse.json({ success: true })
}
