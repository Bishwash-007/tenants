"use client"

import { useRouter } from "next/navigation"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Branch } from "@/lib/api/types"

import { BranchEditForm } from "./branch-edit-form"

interface EditBranchSheetProps {
  branch: Branch | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditBranchSheet({
  branch,
  open,
  onOpenChange,
}: EditBranchSheetProps) {
  const router = useRouter()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{branch ? branch.name : "Edit branch"}</SheetTitle>
          <SheetDescription>
            Update the branch name, address, phone, and timezone.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {branch ? (
            <BranchEditForm
              branch={branch}
              onSuccess={() => {
                onOpenChange(false)
                router.refresh()
              }}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
