"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { BranchCreateForm } from "./branch-create-form"

export function AddBranchSheet() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Add branch
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New branch</SheetTitle>
            <SheetDescription>
              Branch creation counts against your plan&apos;s active-branch
              limit.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <BranchCreateForm
              onSuccess={() => {
                setOpen(false)
                router.refresh()
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
