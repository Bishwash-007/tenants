import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { DeactivateBranchButton } from "@/app/(dashboard)/branches/deactivate-branch-button"
import { ReactivateBranchButton } from "@/app/(dashboard)/branches/reactivate-branch-button"
import { isBranchActive } from "@/lib/api/normalizers"
import { can } from "@/lib/auth/rbac"
import { requireBranchAccess } from "@/lib/auth/session"

import { BranchEditForm } from "@/app/(dashboard)/branches/branch-edit-form"

export default async function BranchEditPage({
  params,
}: {
  params: Promise<{ branchId: string }>
}) {
  const { branchId } = await params
  const { session, branch } = await requireBranchAccess(branchId)

  if (!can(session.role, "manageBranches")) {
    redirect("/forbidden")
  }

  if (!branch) {
    notFound()
  }

  const active = isBranchActive(branch)

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/branches"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            ← All branches
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {branch.name}
          </h1>
        </div>
        <Badge variant={active ? "secondary" : "outline"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <BranchEditForm branch={branch} />

      {active ? (
        <div className="rounded-xl border bg-background p-4">
          <h2 className="text-sm font-semibold">Deactivate branch</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deactivation keeps orders, menu, and table history intact. The
            branch stops counting as an active location.
          </p>
          <div className="mt-3">
            <DeactivateBranchButton
              branchId={branch.id}
              branchName={branch.name}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-background p-4">
          <h2 className="text-sm font-semibold">Reactivate branch</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This branch is inactive. Existing data remains available. Reactivate
            it to make it an active location again; it then counts against the
            plan&apos;s branch limit.
          </p>
          <div className="mt-3">
            <ReactivateBranchButton
              branchId={branch.id}
              branchName={branch.name}
            />
          </div>
        </div>
      )}
    </div>
  )
}
