"use client"

import { useActionState, useEffect, useRef } from "react"

import { ActionMessage, FieldError } from "@/components/forms/action-message"
import { SubmitButton } from "@/components/forms/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IDLE_ACTION_STATE } from "@/lib/actions/state"

import { createTableAction } from "./actions"

interface TableCreateFormProps {
  branchId: string
}

export function TableCreateForm({ branchId }: TableCreateFormProps) {
  const [state, formAction] = useActionState(
    createTableAction,
    IDLE_ACTION_STATE
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset()
    }
  }, [state])

  const errors = state.fieldErrors ?? {}

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border bg-background p-4"
    >
      <input type="hidden" name="branchId" value={branchId} />

      <h2 className="text-sm font-semibold">Add a table</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Labels are unique within the branch.
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-3">
        <div className="min-w-40 flex-1 space-y-1.5">
          <Label htmlFor="table-label">Label</Label>
          <Input
            id="table-label"
            name="label"
            placeholder="T4"
            maxLength={50}
            aria-invalid={Boolean(errors.label)}
          />
          <FieldError message={errors.label} />
        </div>

        <div className="w-28 space-y-1.5">
          <Label htmlFor="table-seats">Seats</Label>
          <Input
            id="table-seats"
            name="seats"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            placeholder="4"
            aria-invalid={Boolean(errors.seats)}
          />
          <FieldError message={errors.seats} />
        </div>

        <div className="pt-5">
          <SubmitButton pendingLabel="Adding…">Add table</SubmitButton>
        </div>
      </div>

      <ActionMessage state={state} className="mt-3" />
    </form>
  )
}
