import { listTablesRequest } from "@/lib/api/endpoints/tables"
import { can } from "@/lib/auth/rbac"
import { requireBranchAccess } from "@/lib/auth/session"

import { TablesClient } from "./tables-client"

export default async function TablesPage({
  params,
}: {
  params: Promise<{ branchId: string }>
}) {
  const { branchId } = await params
  const { session, branch } = await requireBranchAccess(branchId)
  const tables = await listTablesRequest(branchId)
  const canManage = can(session.role, "manageBranches")
  const canCreateOrder = can(session.role, "createOrder")
  const occupied = tables.filter((table) => table.status === "occupied").length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tables</h1>
        <p className="text-sm text-muted-foreground">
          {branch.name} · {tables.length} table
          {tables.length === 1 ? "" : "s"} · {occupied} occupied
        </p>
      </div>

      <TablesClient
        branchId={branchId}
        branch={{
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
        }}
        tables={tables}
        canManage={canManage}
        canCreateOrder={canCreateOrder}
      />
    </div>
  )
}
