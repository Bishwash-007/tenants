"use server"

import { revalidatePath } from "next/cache"

import {
  createShiftRequest,
  deleteShiftRequest,
  setWageRateRequest,
  updateShiftRequest,
} from "@/lib/api/endpoints/staff"
import { sessionAllows, sessionAllowsBranch } from "@/lib/actions/guards"
import {
  errorState,
  invalidState,
  readText,
  successState,
  type ActionState,
} from "@/lib/actions/state"
import {
  createShiftSchema,
  updateShiftSchema,
  wageRateSchema,
} from "@/lib/validation/staff"

export async function createShiftAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const branchId = readText(formData, "branchId")
  if (!(await sessionAllowsBranch("manageStaff", branchId))) {
    return { status: "error", message: "Your role cannot manage shifts." }
  }

  const parsed = createShiftSchema.safeParse({
    userId: readText(formData, "userId"),
    startTime: readText(formData, "startTime"),
    endTime: readText(formData, "endTime"),
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await createShiftRequest(branchId, parsed.data)
    revalidatePath("/", "layout")
    return successState("Shift created.")
  } catch (error) {
    return errorState(error)
  }
}

export async function updateShiftAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const branchId = readText(formData, "branchId")
  const id = readText(formData, "id")
  if (!id) return { status: "error", message: "Missing shift." }
  if (!(await sessionAllowsBranch("manageStaff", branchId))) {
    return { status: "error", message: "Your role cannot manage shifts." }
  }

  const parsed = updateShiftSchema.safeParse({
    userId: readText(formData, "userId") || undefined,
    startTime: readText(formData, "startTime") || undefined,
    endTime: readText(formData, "endTime") || undefined,
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await updateShiftRequest(branchId, id, parsed.data)
    revalidatePath("/", "layout")
    return successState("Shift updated.")
  } catch (error) {
    return errorState(error)
  }
}

export async function deleteShiftAction(
  branchId: string,
  id: string
): Promise<ActionState> {
  if (!(await sessionAllowsBranch("manageStaff", branchId))) {
    return { status: "error", message: "Your role cannot manage shifts." }
  }
  try {
    await deleteShiftRequest(branchId, id)
    revalidatePath("/", "layout")
    return successState("Shift deleted.")
  } catch (error) {
    return errorState(error)
  }
}

export async function setWageRateAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const branchId = readText(formData, "branchId")
  const userId = readText(formData, "userId")
  if (!(await sessionAllowsBranch("manageStaff", branchId))) {
    return { status: "error", message: "Your role cannot manage wage rates." }
  }

  const parsed = wageRateSchema.safeParse({
    payType: readText(formData, "payType"),
    rate: readText(formData, "rate"),
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await setWageRateRequest(branchId, userId, parsed.data)
    revalidatePath("/", "layout")
    return successState("Wage rate saved.")
  } catch (error) {
    return errorState(error)
  }
}

export async function clockInAction(
  branchId: string,
  shiftId?: string
): Promise<ActionState> {
  if (!(await sessionAllows("clockAttendance"))) {
    return { status: "error", message: "Not allowed." }
  }
  try {
    const { clockInRequest } = await import("@/lib/api/endpoints/staff")
    await clockInRequest(branchId, shiftId)
    revalidatePath("/", "layout")
    return successState("Clocked in.")
  } catch (error) {
    return errorState(error)
  }
}

export async function clockOutAction(
  branchId: string,
  shiftId?: string
): Promise<ActionState> {
  if (!(await sessionAllows("clockAttendance"))) {
    return { status: "error", message: "Not allowed." }
  }
  try {
    const { clockOutRequest } = await import("@/lib/api/endpoints/staff")
    await clockOutRequest(branchId, shiftId)
    revalidatePath("/", "layout")
    return successState("Clocked out.")
  } catch (error) {
    return errorState(error)
  }
}
