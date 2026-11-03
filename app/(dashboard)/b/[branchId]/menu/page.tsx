import { can } from "@/lib/auth/rbac"
import { requireBranchAccess } from "@/lib/auth/session"
import {
  getBranchMenuRequest,
  getOrgMenuRequest,
} from "@/lib/api/endpoints/menu"
import { isMenuCategory } from "@/lib/api/types"

import { MenuScopeTabs } from "./menu-scope-tabs"
import { MenuTable } from "./menu-table"

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ branchId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { branchId } = await params
  const query = await searchParams
  const { session, branch } = await requireBranchAccess(branchId)
  const canOrg = can(session.role, "manageOrgMenu")
  const requestedScope = query.scope === "org" ? "org" : "branch"
  const scope = requestedScope === "org" && !canOrg ? "branch" : requestedScope
  const canWrite =
    scope === "org" ? canOrg : can(session.role, "manageBranchMenu")

  const nodes =
    scope === "org"
      ? await getOrgMenuRequest()
      : await getBranchMenuRequest(branchId)
  const categories = nodes.filter(isMenuCategory)
  const itemCount = categories.reduce(
    (total, category) => total + category.items.length,
    0
  )

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Menu</h1>
          <p className="text-sm text-muted-foreground">
            {branch.name} · {categories.length} categor
            {categories.length === 1 ? "y" : "ies"} · {itemCount} item
            {itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <MenuScopeTabs branchId={branchId} scope={scope} canOrg={canOrg} />
      </div>

      <p className="rounded-xl border border-dashed bg-background p-3 text-sm text-muted-foreground">
        {scope === "org"
          ? "This is the tenant-wide template. Every branch inherits it, and a branch-level item with the same name overrides it for that branch only."
          : "This menu merges the org-wide template with this branch's overrides. A branch row wins on name, price, and availability; the org-wide row still applies to every other branch."}
      </p>

      <MenuTable
        categories={categories}
        branchId={branchId}
        scope={scope}
        canWrite={canWrite}
      />
    </div>
  )
}
