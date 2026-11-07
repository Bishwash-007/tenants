"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { deactivateBranchAction } from "./actions"

interface DeactivateBranchButtonProps {
  branchId: string
  branchName: string
}

export function DeactivateBranchButton({
  branchId,
  branchName,
}: DeactivateBranchButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onDeactivate() {
    if (
      !window.confirm(
        `Deactivate "${branchName}"? Its data is kept, but it stops appearing as an active location.`
      )
    ) {
      return
    }

    startTransition(async () => {
      try {
        const result = await deactivateBranchAction(branchId)

        if (result.status === "error") {
          toast.error(result.message ?? "Could not deactivate the branch.")
          return
        }

        toast.success(result.message ?? "Branch deactivated.")
        router.refresh()
      } catch {
        toast.error("Could not deactivate the branch. Check your connection.")
      }
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onDeactivate}
      disabled={pending}
    >
      {pending ? "Deactivating…" : "Deactivate"}
    </Button>
  )
}
