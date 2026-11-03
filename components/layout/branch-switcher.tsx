"use client"

import { usePathname, useRouter } from "next/navigation"

import type { Branch } from "@/lib/api/types"

interface BranchSwitcherProps {
  branches: Branch[]
}

export function BranchSwitcher({ branches }: BranchSwitcherProps) {
  const pathname = usePathname()
  const router = useRouter()
  const match = pathname.match(/^\/b\/([^/]+)(\/.*)?$/)
  const currentBranchId = match?.[1] ?? branches[0]?.id ?? ""

  if (branches.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">No branches yet</span>
    )
  }

  if (branches.length === 1) {
    return <span className="text-sm font-medium">{branches[0]?.name}</span>
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Branch</span>
      <select
        value={currentBranchId}
        onChange={(event) => {
          const branchId = event.target.value
          const suffix = match?.[2] ?? "/overview"
          router.push(`/b/${branchId}${suffix}`)
        }}
        className="h-9 max-w-52 rounded-md border border-border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </label>
  )
}
