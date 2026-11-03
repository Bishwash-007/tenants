import { NextResponse } from "next/server"

import { listKdsOrdersRequest } from "@/lib/api/endpoints/kds"
import { ApiError } from "@/lib/api/errors"
import { getAccessToken } from "@/lib/auth/cookies"
import { isSameOrigin } from "@/lib/auth/origin"

export async function GET(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Cross-site request rejected" },
      { status: 403 }
    )
  }

  if (!(await getAccessToken())) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const branchId = searchParams.get("branchId")

  if (!branchId) {
    return NextResponse.json(
      { message: "Branch ID is required" },
      { status: 400 }
    )
  }

  try {
    const orders = await listKdsOrdersRequest(branchId)
    return NextResponse.json(orders)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.messages },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
