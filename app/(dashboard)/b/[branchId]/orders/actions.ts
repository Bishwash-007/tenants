"use server"

import { revalidatePath } from "next/cache"

import {
  createOrderRequest,
  transitionOrderRequest,
} from "@/lib/api/endpoints/orders"
import { sessionAllowsBranch } from "@/lib/actions/guards"
import {
  errorState,
  invalidState,
  readText,
  successState,
  type ActionState,
} from "@/lib/actions/state"
import {
  createOrderSchema,
  transitionOrderSchema,
} from "@/lib/validation/orders"

export async function createOrderAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const branchId = readText(formData, "branchId")

  if (!branchId) {
    return { status: "error", message: "Missing branch." }
  }

  if (!(await sessionAllowsBranch("createOrder", branchId))) {
    return {
      status: "error",
      message: "Your role cannot create orders for this branch.",
    }
  }

  const itemsJson = readText(formData, "items")
  let items: unknown

  try {
    items = JSON.parse(itemsJson)
  } catch {
    return { status: "error", message: "Invalid items payload." }
  }

  const parsed = createOrderSchema.safeParse({
    branchId,
    tableId: readText(formData, "tableId") || null,
    customerId: readText(formData, "customerId") || null,
    orderType: readText(formData, "orderType") || "dine_in",
    clientActionId: readText(formData, "clientActionId") || null,
    taxAmount: readText(formData, "taxAmount")
      ? Number(readText(formData, "taxAmount"))
      : 0,
    discountAmount: readText(formData, "discountAmount")
      ? Number(readText(formData, "discountAmount"))
      : 0,
    items,
  })

  if (!parsed.success) {
    return invalidState(parsed.error)
  }

  try {
    const order = await createOrderRequest(parsed.data)
    revalidatePath(`/b/${branchId}/orders`, "layout")
    return successState(`Order ${order.id} created.`, order.id)
  } catch (error) {
    return errorState(error)
  }
}

export async function transitionOrderAction(
  orderId: string,
  status: string,
  branchId: string
): Promise<ActionState> {
  if (!branchId) {
    return { status: "error", message: "Missing branch." }
  }

  if (!(await sessionAllowsBranch("transitionOrder", branchId))) {
    return errorState(
      new Error("Your role cannot transition orders for this branch.")
    )
  }

  const parsed = transitionOrderSchema.safeParse({ status })

  if (!parsed.success) {
    return invalidState(parsed.error)
  }

  try {
    await transitionOrderRequest(orderId, parsed.data.status)
    revalidatePath("/", "layout")
    return successState(`Order moved to ${parsed.data.status}.`)
  } catch (error) {
    return errorState(error)
  }
}
