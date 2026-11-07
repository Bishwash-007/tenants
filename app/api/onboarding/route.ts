import { NextResponse } from "next/server"

import { onboardRequest } from "@/lib/api/endpoints/onboarding"
import { ApiError } from "@/lib/api/errors"
import { isSameOrigin } from "@/lib/auth/origin"

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

  const body = payload as {
    orgName?: string
    slug?: string
    planId?: string
    firstBranch?: { name?: string; address?: string | null }
    defaultTables?: number
    owner?: { email?: string; password?: string }
  }

  if (
    !body.orgName ||
    !body.slug ||
    !body.firstBranch?.name ||
    !body.owner?.email ||
    !body.owner?.password
  ) {
    return NextResponse.json(
      { message: "Missing required onboarding fields" },
      { status: 400 }
    )
  }

  try {
    const result = await onboardRequest({
      orgName: body.orgName,
      slug: body.slug,
      planId: body.planId || undefined,
      firstBranch: {
        name: body.firstBranch.name,
        address: body.firstBranch.address ?? null,
      },
      defaultTables: body.defaultTables,
      owner: {
        email: body.owner.email,
        password: body.owner.password,
      },
    })

    return NextResponse.json(result, { status: 201 })
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

    return NextResponse.json({ message: "Onboarding failed" }, { status: 500 })
  }
}
