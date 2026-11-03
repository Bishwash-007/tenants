import { cn } from "cn"

import type { ActionState } from "@/lib/actions/state"

interface ActionMessageProps {
  state: ActionState
  className?: string
}

export function ActionMessage({ state, className }: ActionMessageProps) {
  if (state.status === "idle" || !state.message) {
    return null
  }

  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        state.status === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        className
      )}
    >
      {state.message}
    </p>
  )
}

interface FieldErrorProps {
  message?: string
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null
  }

  return <p className="text-xs text-destructive">{message}</p>
}
