"use server"

import { revalidatePath } from "next/cache"

import { createTableRequest } from "@/lib/api/endpoints/tables"
import { sessionAllowsBranch } from "@/lib/actions/guards"
import {
  errorState,
  invalidState,
  readText,
  successState,
  type ActionState,
} from "@/lib/actions/state"
import { createTableSchema } from "@/lib/validation/tables"

export async function createTableAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const branchId = readText(formData, "branchId")

  if (!branchId) {
    return { status: "error", message: "Missing branch." }
  }

  if (!(await sessionAllowsBranch("manageBranches", branchId))) {
    return {
      status: "error",
      message: "Your role cannot add tables to this branch.",
    }
  }

  const parsed = createTableSchema.safeParse({
    label: readText(formData, "label"),
    seats: readText(formData, "seats"),
  })

  if (!parsed.success) {
    return invalidState(parsed.error)
  }

  try {
    await createTableRequest(branchId, parsed.data)
    revalidatePath("/", "layout")
    return successState(`Table ${parsed.data.label} added.`)
  } catch (error) {
    return errorState(error)
  }
}
