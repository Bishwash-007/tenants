import { NextResponse } from "next/server"

import { transitionOrderRequest } from "@/lib/api/endpoints/orders"
import { ApiError } from "@/lib/api/errors"
import { getAccessToken } from "@/lib/auth/cookies"
import { isSameOrigin } from "@/lib/auth/origin"

export async function POST(
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

  let body: { status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 }
    )
  }

  if (!body.status) {
    return NextResponse.json({ message: "Status is required" }, { status: 400 })
  }

  try {
    const order = await transitionOrderRequest(orderId, body.status)
    return NextResponse.json(order)
  } catch (error) {
    // Surface the API's state-machine message (e.g. "Cannot transition from
    // served to placed") instead of collapsing every failure into a 500.
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.messages },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { message: "Failed to transition order" },
      { status: 500 }
    )
  }
}
