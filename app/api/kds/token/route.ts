import { NextResponse } from "next/server"

import { getAccessToken } from "@/lib/auth/cookies"
import { getTenantSlug } from "@/lib/auth/request-context"
import { isSameOrigin } from "@/lib/auth/origin"

export async function GET(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Cross-site request rejected" },
      { status: 403 }
    )
  }

  const accessToken = await getAccessToken()
  const tenantSlug = await getTenantSlug()

  if (!accessToken || !tenantSlug) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  return NextResponse.json({ accessToken, tenantSlug })
}
