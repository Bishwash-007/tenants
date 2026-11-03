"use server"

import { revalidatePath } from "next/cache"

import {
  activateBranchRequest,
  createBranchRequest,
  deactivateBranchRequest,
  updateBranchRequest,
} from "@/lib/api/endpoints/branches"
import {
  errorState,
  invalidState,
  readText,
  successState,
  type ActionState,
} from "@/lib/actions/state"
import { sessionAllows } from "@/lib/actions/guards"
import {
  createBranchSchema,
  updateBranchSchema,
} from "@/lib/validation/branches"

const DENIED: ActionState = {
  status: "error",
  message: "Your role cannot manage branches.",
}

export async function createBranchAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await sessionAllows("manageBranches"))) {
    return DENIED
  }

  const parsed = createBranchSchema.safeParse({
    name: readText(formData, "name"),
    address: readText(formData, "address"),
    phone: readText(formData, "phone"),
  })

  if (!parsed.success) {
    return invalidState(parsed.error)
  }

  try {
    await createBranchRequest(parsed.data)
    revalidatePath("/", "layout")
    return successState("Branch created.")
  } catch (error) {
    return errorState(error)
  }
}

export async function updateBranchAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await sessionAllows("manageBranches"))) {
    return DENIED
  }

  const branchId = readText(formData, "branchId")
  const parsed = updateBranchSchema.safeParse({
    name: readText(formData, "name"),
    address: readText(formData, "address"),
    phone: readText(formData, "phone"),
    timezone: readText(formData, "timezone"),
  })

  if (!branchId) {
    return { status: "error", message: "Missing branch." }
  }

  if (!parsed.success) {
    return invalidState(parsed.error)
  }

  try {
    await updateBranchRequest(branchId, parsed.data)
    revalidatePath("/", "layout")
    return successState("Branch updated.")
  } catch (error) {
    return errorState(error)
  }
}

export async function deactivateBranchAction(
  branchId: string
): Promise<ActionState> {
  if (!(await sessionAllows("manageBranches"))) {
    return DENIED
  }

  if (!branchId) {
    return { status: "error", message: "Missing branch." }
  }

  try {
    await deactivateBranchRequest(branchId)
    revalidatePath("/", "layout")
    return successState("Branch deactivated.")
  } catch (error) {
    return errorState(error)
  }
}

export async function reactivateBranchAction(
  branchId: string
): Promise<ActionState> {
  if (!(await sessionAllows("manageBranches"))) {
    return DENIED
  }

  if (!branchId) {
    return { status: "error", message: "Missing branch." }
  }

  try {
    await activateBranchRequest(branchId)
    revalidatePath("/", "layout")
    return successState("Branch reactivated.")
  } catch (error) {
    return errorState(error)
  }
}
