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

import { CategoryCreateForm } from "./category-create-form"

interface AddCategorySheetProps {
  branchId: string
  scope: "branch" | "org"
}

export function AddCategorySheet({ branchId, scope }: AddCategorySheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Add category
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New category</SheetTitle>
            <SheetDescription>
              Categories group items on the menu. You can add items once the
              category exists.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <CategoryCreateForm
              branchId={branchId}
              scope={scope}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
