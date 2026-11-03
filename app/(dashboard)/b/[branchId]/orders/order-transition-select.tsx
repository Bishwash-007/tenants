"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  TRANSITIONS,
  TRANSITION_LABELS,
  type OrderStatus,
} from "@/lib/kds/types"

import { transitionOrderAction } from "./actions"

interface OrderTransitionSelectProps {
  orderId: string
  branchId: string
  currentStatus: string
}

export function OrderTransitionSelect({
  orderId,
  branchId,
  currentStatus,
}: OrderTransitionSelectProps) {
  const router = useRouter()
  const [status, setStatus] = useState("")
  const [pending, startTransition] = useTransition()

  const allowed = TRANSITIONS[currentStatus as OrderStatus] ?? []

  if (allowed.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">(no transitions)</span>
    )
  }

  function move() {
    if (!status) {
      return
    }

    startTransition(async () => {
      try {
        const result = await transitionOrderAction(orderId, status, branchId)

        if (result.status === "error") {
          toast.error(result.message ?? "Could not move the order.")
          return
        }

        toast.success(result.message ?? "Order moved.")
        setStatus("")
        router.refresh()
      } catch {
        toast.error("Could not move the order. Check your connection.")
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        name="status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        disabled={pending}
        className="h-8 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50"
      >
        <option value="" disabled>
          Next status…
        </option>
        {allowed.map((next) => (
          <option key={next} value={next}>
            {TRANSITION_LABELS[next]}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={move} disabled={!status || pending}>
        {pending ? "Moving…" : "Move"}
      </Button>
    </div>
  )
}
