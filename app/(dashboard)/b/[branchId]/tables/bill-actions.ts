"use server"

import {
  checkoutBillRequest,
  prepareBillRequest,
  type Bill,
  type BillCheckoutResult,
} from "@/lib/api/endpoints/bills"
import { sessionAllowsBranch } from "@/lib/actions/guards"
import { ApiError } from "@/lib/api/errors"

export type BillActionResult =
  { ok: true; bill: Bill } | { ok: false; message: string }

export type BillCheckoutActionResult =
  { ok: true; result: BillCheckoutResult } | { ok: false; message: string }

export async function prepareBillForTableAction(
  branchId: string,
  tableId: string
): Promise<BillActionResult> {
  if (!(await sessionAllowsBranch("createOrder", branchId))) {
    return {
      ok: false,
      message: "Your role cannot prepare bills for this branch.",
    }
  }

  try {
    const bill = await prepareBillRequest({ branchId, tableId })
    return { ok: true, bill }
  } catch (error) {
    if (error instanceof ApiError) {
      const message = Array.isArray(error.messages)
        ? error.messages.join(". ")
        : error.messages
      return { ok: false, message }
    }
    return { ok: false, message: "Could not prepare the bill." }
  }
}

export async function prepareBillForOrdersAction(
  branchId: string,
  orderIds: string[]
): Promise<BillActionResult> {
  if (!(await sessionAllowsBranch("createOrder", branchId))) {
    return {
      ok: false,
      message: "Your role cannot prepare bills for this branch.",
    }
  }

  try {
    const bill = await prepareBillRequest({ branchId, orderIds })
    return { ok: true, bill }
  } catch (error) {
    if (error instanceof ApiError) {
      const message = Array.isArray(error.messages)
        ? error.messages.join(". ")
        : error.messages
      return { ok: false, message }
    }
    return { ok: false, message: "Could not prepare the bill." }
  }
}

export async function checkoutBillAction(
  billId: string
): Promise<BillCheckoutActionResult> {
  try {
    const result = await checkoutBillRequest(billId)
    return { ok: true, result }
  } catch (error) {
    if (error instanceof ApiError) {
      const message = Array.isArray(error.messages)
        ? error.messages.join(". ")
        : error.messages
      return { ok: false, message }
    }
    return { ok: false, message: "Could not start checkout." }
  }
}
