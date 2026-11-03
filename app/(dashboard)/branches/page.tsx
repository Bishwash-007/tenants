import { isBranchActive } from "@/lib/api/normalizers"
import { can } from "@/lib/auth/rbac"
import { getBranches, requireSession } from "@/lib/auth/session"

import { BranchesTable } from "./branches-table"

export default async function BranchesPage() {
  const session = await requireSession()
  const branches = await getBranches()
  const canManage = can(session.role, "manageBranches")
  const activeCount = branches.filter(isBranchActive).length

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Branches</h1>
          <p className="text-sm text-muted-foreground">
            {branches.length === 0
              ? "Locations your workspace operates."
              : `${activeCount} active of ${branches.length} location${
                  branches.length === 1 ? "" : "s"
                }.`}
          </p>
        </div>
      </div>

      <BranchesTable branches={branches} canManage={canManage} />
    </div>
  )
}
