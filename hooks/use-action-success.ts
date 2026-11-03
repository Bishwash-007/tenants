"use client"

import { useEffect, useRef } from "react"

import type { ActionState } from "@/lib/actions/state"

/**
 * Runs a callback the first time a server action reports success.
 *
 * `useActionState` returns a fresh object per submission, so compare identity
 * rather than status: submitting twice should run the callback twice.
 */
export function useActionSuccess(
  state: ActionState,
  onSuccess?: () => void
): void {
  const previous = useRef<ActionState>(state)

  useEffect(() => {
    if (state === previous.current) {
      return
    }

    previous.current = state

    if (state.status === "success") {
      onSuccess?.()
    }
  }, [state, onSuccess])
}
