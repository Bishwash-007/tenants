"use client"

import { useActionState } from "react"

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
import type { MenuCategory, MenuItem } from "@/lib/api/types"
import { env } from "@/lib/env-client"
import { formatMoney } from "@/lib/format/money"
import { useActionSuccess } from "@/hooks/use-action-success"
import { useActionToast } from "@/hooks/use-action-toast"

import { addModifierAction, updateItemAction } from "./actions"

interface ItemEditorProps {
  item: MenuItem
  categories: Pick<MenuCategory, "id" | "name">[]
  onSuccess?: () => void
}

export function ItemEditor({ item, categories, onSuccess }: ItemEditorProps) {
  const [updateState, updateAction] = useActionState(
    updateItemAction,
    IDLE_ACTION_STATE
  )
  const [modifierState, modifierAction] = useActionState(
    addModifierAction,
    IDLE_ACTION_STATE
  )
  useActionToast(updateState)
  useActionToast(modifierState)
  useActionSuccess(updateState, onSuccess)

  const errors = updateState.fieldErrors ?? {}
  const modifierErrors = modifierState.fieldErrors ?? {}
  const currency = env.NEXT_PUBLIC_DEFAULT_CURRENCY

  return (
    <div className="space-y-6">
      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="itemId" value={item.id} />

        <div className="space-y-1.5">
          <Label htmlFor={`item-name-${item.id}`}>Name</Label>
          <Input
            id={`item-name-${item.id}`}
            name="name"
            defaultValue={item.name}
            maxLength={150}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`item-price-${item.id}`}>Price</Label>
            <Input
              id={`item-price-${item.id}`}
              name="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              defaultValue={item.basePrice}
              aria-invalid={Boolean(errors.price)}
            />
            <FieldError message={errors.price} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`item-category-${item.id}`}>Category</Label>
            <Select
              name="categoryId"
              defaultValue={item.categoryId ?? categories[0]?.id}
              items={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            >
              <SelectTrigger
                id={`item-category-${item.id}`}
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
          <Label htmlFor={`item-description-${item.id}`}>Description</Label>
          <Textarea
            id={`item-description-${item.id}`}
            name="description"
            defaultValue={item.description ?? ""}
            maxLength={2000}
            rows={3}
            aria-invalid={Boolean(errors.description)}
          />
          <FieldError message={errors.description} />
        </div>

        <SubmitButton pendingLabel="Saving…" className="w-full">
          Save changes
        </SubmitButton>
      </form>

      <div className="space-y-3 border-t pt-4">
        <div>
          <h3 className="text-sm font-semibold">Modifiers</h3>
          <p className="text-sm text-muted-foreground">
            Modifiers stack onto the base price at order time.
          </p>
        </div>

        {item.modifiers.length > 0 ? (
          <ul className="space-y-1.5">
            {item.modifiers.map((modifier, index) => (
              <li
                key={`${modifier.name}-${modifier.optionName}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-2.5 py-1.5 text-sm"
              >
                <span>
                  {modifier.name}: {modifier.optionName}
                </span>
                <span className="font-medium">
                  +{formatMoney(modifier.extraPrice, currency)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
            No modifiers yet.
          </p>
        )}
      </div>

      <form action={modifierAction} className="space-y-3 border-t pt-4">
        <input type="hidden" name="itemId" value={item.id} />
        <h3 className="text-sm font-semibold">Add a modifier option</h3>

        <div className="space-y-1.5">
          <Label htmlFor={`modifier-name-${item.id}`}>Group</Label>
          <Input
            id={`modifier-name-${item.id}`}
            name="name"
            placeholder="Size"
            maxLength={100}
            aria-invalid={Boolean(modifierErrors.name)}
          />
          <FieldError message={modifierErrors.name} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`modifier-option-${item.id}`}>Option</Label>
            <Input
              id={`modifier-option-${item.id}`}
              name="optionName"
              placeholder="Large"
              maxLength={100}
              aria-invalid={Boolean(modifierErrors.optionName)}
            />
            <FieldError message={modifierErrors.optionName} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`modifier-price-${item.id}`}>Extra price</Label>
            <Input
              id={`modifier-price-${item.id}`}
              name="extraPrice"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              placeholder="0.75"
              aria-invalid={Boolean(modifierErrors.extraPrice)}
            />
            <FieldError message={modifierErrors.extraPrice} />
          </div>
        </div>

        <SubmitButton
          variant="secondary"
          pendingLabel="Adding…"
          className="w-full"
        >
          Add option
        </SubmitButton>
      </form>
    </div>
  )
}
