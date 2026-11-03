"use client"

import { useActionState } from "react"

import { FieldError } from "@/components/forms/action-message"
import { SubmitButton } from "@/components/forms/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IDLE_ACTION_STATE } from "@/lib/actions/state"
import { useActionSuccess } from "@/hooks/use-action-success"
import { useActionToast } from "@/hooks/use-action-toast"

import { createCategoryAction } from "./actions"

interface CategoryCreateFormProps {
  branchId: string
  scope: "branch" | "org"
  onSuccess?: () => void
}

export function CategoryCreateForm({
  branchId,
  scope,
  onSuccess,
}: CategoryCreateFormProps) {
  const [state, formAction] = useActionState(
    createCategoryAction,
    IDLE_ACTION_STATE
  )
  useActionToast(state)
  useActionSuccess(state, onSuccess)

  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="scope" value={scope} />

      <div className="space-y-1.5">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          name="name"
          placeholder="Seasonal"
          maxLength={150}
          aria-invalid={Boolean(errors.name)}
        />
        <FieldError message={errors.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category-sort">Sort order</Label>
        <Input
          id="category-sort"
          name="sortOrder"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="1"
          aria-invalid={Boolean(errors.sortOrder)}
        />
        <p className="text-xs text-muted-foreground">
          Lower numbers appear first on the menu.
        </p>
        <FieldError message={errors.sortOrder} />
      </div>

      <SubmitButton pendingLabel="Adding…" className="w-full">
        Add category
      </SubmitButton>
    </form>
  )
}
