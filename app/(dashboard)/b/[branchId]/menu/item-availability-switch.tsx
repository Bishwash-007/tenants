"use client"

import { useOptimistic, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Switch } from "@/components/ui/switch"

import { setItemAvailabilityAction } from "./actions"

interface ItemAvailabilitySwitchProps {
  itemId: string
  itemName: string
  isAvailable: boolean
  /** Show the Available/Hidden caption next to the switch. */
  showLabel?: boolean
}

export function ItemAvailabilitySwitch({
  itemId,
  itemName,
  isAvailable,
  showLabel = true,
}: ItemAvailabilitySwitchProps) {
  const router = useRouter()
  const [optimisticAvailable, setOptimisticAvailable] =
    useOptimistic(isAvailable)
  const [pending, startTransition] = useTransition()

  function onChange(next: boolean) {
    startTransition(async () => {
      setOptimisticAvailable(next)
      const result = await setItemAvailabilityAction(itemId, next)

      if (result.status === "error") {
        toast.error(result.message ?? "Could not change availability.")
        return
      }

      toast.success(
        next ? `${itemName} is now available.` : `${itemName} is now hidden.`
      )
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Switch
        checked={optimisticAvailable}
        onCheckedChange={onChange}
        disabled={pending}
        aria-label={`${itemName} availability`}
      />
      {showLabel ? (
        <span className="text-xs text-muted-foreground">
          {optimisticAvailable ? "Available" : "Hidden"}
        </span>
      ) : null}
    </div>
  )
}
