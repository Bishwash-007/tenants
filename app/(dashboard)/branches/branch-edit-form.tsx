"use client"

import { useActionState } from "react"

import { FieldError } from "@/components/forms/action-message"
import { SubmitButton } from "@/components/forms/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useActionSuccess } from "@/hooks/use-action-success"
import { useActionToast } from "@/hooks/use-action-toast"
import { IDLE_ACTION_STATE } from "@/lib/actions/state"
import type { Branch } from "@/lib/api/types"

import { updateBranchAction } from "./actions"

interface BranchEditFormProps {
  branch: Branch
  onSuccess?: () => void
}

export function BranchEditForm({ branch, onSuccess }: BranchEditFormProps) {
  const [state, formAction] = useActionState(
    updateBranchAction,
    IDLE_ACTION_STATE
  )
  useActionToast(state)
  useActionSuccess(state, onSuccess)

  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="branchId" value={branch.id} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-name">Name</Label>
          <Input
            id="edit-name"
            name="name"
            defaultValue={branch.name}
            maxLength={150}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-timezone">Timezone</Label>
          <Input
            id="edit-timezone"
            name="timezone"
            defaultValue={branch.timezone ?? "UTC"}
            placeholder="Asia/Kathmandu"
            maxLength={50}
            aria-invalid={Boolean(errors.timezone)}
          />
          <FieldError message={errors.timezone} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-phone">Phone</Label>
          <Input
            id="edit-phone"
            name="phone"
            defaultValue={branch.phone ?? ""}
            maxLength={30}
            aria-invalid={Boolean(errors.phone)}
          />
          <FieldError message={errors.phone} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-address">Address</Label>
          <Input
            id="edit-address"
            name="address"
            defaultValue={branch.address ?? ""}
            maxLength={1000}
            aria-invalid={Boolean(errors.address)}
          />
          <FieldError message={errors.address} />
        </div>
      </div>

      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save changes
      </SubmitButton>
    </form>
  )
}
