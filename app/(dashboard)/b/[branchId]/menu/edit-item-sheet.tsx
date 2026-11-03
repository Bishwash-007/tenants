"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import type { MenuCategory, MenuItem } from "@/lib/api/types"

import { ItemEditor } from "./item-editor"

interface EditItemSheetProps {
  item: MenuItem | null
  categories: Pick<MenuCategory, "id" | "name">[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditItemSheet({
  item,
  categories,
  open,
  onOpenChange,
}: EditItemSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{item ? item.name : "Edit item"}</SheetTitle>
          <SheetDescription>
            Update the item details, price, category, and modifiers.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {item ? (
            <ItemEditor
              item={item}
              categories={categories}
              onSuccess={() => onOpenChange(false)}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
