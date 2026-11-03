"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { reactivateBranchAction } from "./actions"

interface ReactivateBranchButtonProps {
  branchId: string
  branchName: string
}

export function ReactivateBranchButton({
  branchId,
  branchName,
}: ReactivateBranchButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onReactivate() {
    if (
      !window.confirm(
        `Reactivate "${branchName}"? It becomes an active location again and counts against the plan's branch limit.`
      )
    ) {
      return
    }

    startTransition(async () => {
      try {
        const result = await reactivateBranchAction(branchId)

        if (result.status === "error") {
          toast.error(result.message ?? "Could not reactivate the branch.")
          return
        }

        toast.success(result.message ?? "Branch reactivated.")
        router.refresh()
      } catch {
        toast.error("Could not reactivate the branch. Check your connection.")
      }
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onReactivate}
      disabled={pending}
    >
      {pending ? "Reactivating…" : "Reactivate"}
    </Button>
  )
}
