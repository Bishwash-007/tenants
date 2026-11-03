"use client"

import { useState } from "react"
import { PlusIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import type { MenuCategory } from "@/lib/api/types"

import { ItemCreateForm } from "./item-create-form"

interface AddItemSheetProps {
  branchId: string
  scope: "branch" | "org"
  categories: Pick<MenuCategory, "id" | "name">[]
}

export function AddItemSheet({
  branchId,
  scope,
  categories,
}: AddItemSheetProps) {
  const [open, setOpen] = useState(false)
  const hasCategories = categories.length > 0

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={!hasCategories}
        title={
          hasCategories ? undefined : "Create a category before adding items."
        }
      >
        <PlusIcon data-icon="inline-start" />
        Add item
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New item</SheetTitle>
            <SheetDescription>
              {scope === "org"
                ? "Org-wide items appear on every branch's menu."
                : "This item appears only on this branch's menu."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <ItemCreateForm
              branchId={branchId}
              scope={scope}
              categories={categories}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
