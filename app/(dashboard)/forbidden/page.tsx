import Link from "next/link"

import { requireRole } from "@/lib/auth/session"

export default async function ForbiddenPage() {
  await requireRole([
    "super_admin",
    "org_owner",
    "branch_manager",
    "receptionist",
    "waiter",
    "kitchen_staff",
  ])

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-background p-6">
      <h1 className="text-lg font-semibold">Not allowed</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your role does not have access to this page.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
