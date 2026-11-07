"use client"

import { useActionState, useEffect, useRef } from "react"

import { FieldError } from "@/components/forms/action-message"
import { SubmitButton } from "@/components/forms/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IDLE_ACTION_STATE } from "@/lib/actions/state"
import { useActionToast } from "@/hooks/use-action-toast"
import { useActionSuccess } from "@/hooks/use-action-success"

import { createTableAction } from "./actions"

interface TableCreateFormProps {
  branchId: string
  onSuccess?: () => void
}

export function TableCreateForm({ branchId, onSuccess }: TableCreateFormProps) {
  const [state, formAction] = useActionState(
    createTableAction,
    IDLE_ACTION_STATE
  )
  const formRef = useRef<HTMLFormElement>(null)

  useActionToast(state)
  useActionSuccess(state, onSuccess)
  useActionSuccess(state, () => formRef.current?.reset())

  const errors = state.fieldErrors ?? {}

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="branchId" value={branchId} />

      <div className="space-y-1.5">
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

      <div className="space-y-1.5">
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

      <SubmitButton pendingLabel="Adding…" className="w-full">
        Add table
      </SubmitButton>
    </form>
  )
}
