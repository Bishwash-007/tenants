"use client"

import { useActionState, useRef } from "react"

import { FieldError } from "@/components/forms/action-message"
import { SubmitButton } from "@/components/forms/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { IDLE_ACTION_STATE } from "@/lib/actions/state"
import type { MenuCategory } from "@/lib/api/types"
import { useActionSuccess } from "@/hooks/use-action-success"
import { useActionToast } from "@/hooks/use-action-toast"

import { createItemAction } from "./actions"

interface ItemCreateFormProps {
  branchId: string
  scope: "branch" | "org"
  categories: Pick<MenuCategory, "id" | "name">[]
  onSuccess?: () => void
}

export function ItemCreateForm({
  branchId,
  scope,
  categories,
  onSuccess,
}: ItemCreateFormProps) {
  const [state, formAction] = useActionState(
    createItemAction,
    IDLE_ACTION_STATE
  )
  const formRef = useRef<HTMLFormElement>(null)
  useActionToast(state)
  useActionSuccess(state, onSuccess)
  // Clear the fields after a successful add so reopening the sheet starts clean.
  useActionSuccess(state, () => formRef.current?.reset())

  const errors = state.fieldErrors ?? {}
  const hasCategories = categories.length > 0

  if (!hasCategories) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Create a category first — items need a category to appear on the menu.
      </p>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="scope" value={scope} />

      <div className="space-y-1.5">
        <Label htmlFor="item-name">Name</Label>
        <Input
          id="item-name"
          name="name"
          placeholder="Flat White"
          maxLength={150}
          aria-invalid={Boolean(errors.name)}
        />
        <FieldError message={errors.name} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="item-price">Price</Label>
          <Input
            id="item-price"
            name="price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            placeholder="4.50"
            aria-invalid={Boolean(errors.price)}
          />
          <FieldError message={errors.price} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="item-category">Category</Label>
          <Select
            name="categoryId"
            defaultValue={categories[0]?.id}
            items={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          >
            <SelectTrigger
              id="item-category"
              className="w-full"
              aria-invalid={Boolean(errors.categoryId)}
            >
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.categoryId} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="item-description">Description</Label>
        <Textarea
          id="item-description"
          name="description"
          placeholder="Optional"
          maxLength={2000}
          rows={3}
          aria-invalid={Boolean(errors.description)}
        />
        <FieldError message={errors.description} />
      </div>

      <p className="text-xs text-muted-foreground">
        {scope === "org"
          ? "Org-wide items appear on every branch's menu."
          : "Branch items appear only on this branch and can override an org-wide item of the same name."}
      </p>

      <SubmitButton pendingLabel="Adding…" className="w-full">
        Add item
      </SubmitButton>
    </form>
  )
}
