"use client"

import { useActionState } from "react"

import { FieldError } from "@/components/forms/action-message"
import { SubmitButton } from "@/components/forms/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useActionSuccess } from "@/hooks/use-action-success"
import { useActionToast } from "@/hooks/use-action-toast"
import { IDLE_ACTION_STATE } from "@/lib/actions/state"

import { createBranchAction } from "./actions"

interface BranchCreateFormProps {
  onSuccess?: () => void
}

export function BranchCreateForm({ onSuccess }: BranchCreateFormProps) {
  const [state, formAction] = useActionState(
    createBranchAction,
    IDLE_ACTION_STATE
  )
  useActionToast(state)
  useActionSuccess(state, onSuccess)

  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="branch-name">Name</Label>
          <Input
            id="branch-name"
            name="name"
            placeholder="Acme Lakeside"
            maxLength={150}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="branch-phone">Phone</Label>
          <Input
            id="branch-phone"
            name="phone"
            placeholder="+977-9800000000"
            maxLength={30}
            aria-invalid={Boolean(errors.phone)}
          />
          <FieldError message={errors.phone} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="branch-address">Address</Label>
          <Input
            id="branch-address"
            name="address"
            placeholder="Lakeside, Pokhara"
            maxLength={1000}
            aria-invalid={Boolean(errors.address)}
          />
          <FieldError message={errors.address} />
        </div>
      </div>

      <SubmitButton pendingLabel="Creating…" className="w-full">
        Create branch
      </SubmitButton>
    </form>
  )
}
