"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SignOut } from "@phosphor-icons/react"

import type { Role } from "@/lib/auth/rbac"

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super admin",
  org_owner: "Owner",
  branch_manager: "Branch manager",
  receptionist: "Receptionist",
  waiter: "Waiter",
  kitchen_staff: "Kitchen staff",
  customer: "Customer",
}

interface UserMenuProps {
  fullName: string
  email: string
  role: Role
}

export function UserMenu({ fullName, email, role }: UserMenuProps) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  async function signOut() {
    setSigningOut(true)

    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.replace("/login")
      router.refresh()
    }
  }

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted [&::-webkit-details-marker]:hidden">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {initials || "?"}
        </span>
        <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">
          {fullName}
        </span>
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ROLE_LABELS[role]}
          </p>
        </div>
        <div className="my-1 h-px bg-border" />
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={signingOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <SignOut className="size-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </details>
  )
}
