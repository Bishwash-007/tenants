import type { ZodError } from "zod"

import { getErrorMessage } from "@/lib/api/errors"

export type ActionState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Record<string, string>
  orderId?: string
}

export const IDLE_ACTION_STATE: ActionState = { status: "idle" }

/** Keep the first validation error per field; that is what a form can show. */
export function fieldErrorsFromZod(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}

  for (const issue of error.issues) {
    const field = issue.path[0]

    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

export function invalidState(error: ZodError): ActionState {
  // TEMP DEBUG: remove once form validation is behaving.
  console.warn("[action] validation failed", error.issues)

  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: fieldErrorsFromZod(error),
  }
}

export function errorState(error: unknown): ActionState {
  // TEMP DEBUG: remove once the API is behaving. Prints the stack for
  // unexpected errors that the user-facing message would otherwise hide.
  console.error("[action] failed", error)

  return { status: "error", message: getErrorMessage(error) }
}

export function successState(message: string, orderId?: string): ActionState {
  return { status: "success", message, orderId }
}

export function readText(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}
