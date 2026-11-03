import { NextResponse } from "next/server"

import {
  enrichKdsOrderWithTableLabel,
  getKdsOrderRequest,
} from "@/lib/api/endpoints/kds"
import { ApiError } from "@/lib/api/errors"
import { getAccessToken } from "@/lib/auth/cookies"
import { isSameOrigin } from "@/lib/auth/origin"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Cross-site request rejected" },
      { status: 403 }
    )
  }

  if (!(await getAccessToken())) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  const { orderId } = await params

  try {
    const order = await getKdsOrderRequest(orderId)
    const enriched = await enrichKdsOrderWithTableLabel(order, order.branchId)
    return NextResponse.json(enriched)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.messages },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { message: "Failed to fetch order" },
      { status: 500 }
    )
  }
}
