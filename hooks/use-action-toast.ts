"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

import type { ActionState } from "@/lib/actions/state"

/**
 * Shows a server action's result as a Sonner toast instead of an inline
 * banner. Field-level messages still render next to their inputs via
 * `FieldError`.
 *
 * `useActionState` hands back a fresh object for every submission, so we
 * compare object identity rather than the status string: submitting the same
 * thing twice still toasts twice.
 */
export function useActionToast(state: ActionState): void {
  const previous = useRef<ActionState>(state)

  useEffect(() => {
    if (state === previous.current) {
      return
    }

    previous.current = state

    if (state.status === "success") {
      toast.success(state.message ?? "Saved.")
      return
    }

    if (state.status === "error") {
      // Validation errors render inline next to their fields, so only toast
      // unexpected (non-field) failures.
      const hasFieldErrors =
        state.fieldErrors !== undefined &&
        Object.keys(state.fieldErrors).length > 0
      if (hasFieldErrors) {
        return
      }
      toast.error(state.message ?? "Something went wrong.")
    }
  }, [state])
}
