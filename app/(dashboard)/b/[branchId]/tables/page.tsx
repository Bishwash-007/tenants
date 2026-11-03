import { Badge } from "@/components/ui/badge"
import { listTablesRequest } from "@/lib/api/endpoints/tables"
import { tableStatusLabel } from "@/lib/api/normalizers"
import { can } from "@/lib/auth/rbac"
import { requireBranchAccess } from "@/lib/auth/session"

import { TableCreateForm } from "./table-create-form"

const STATUS_VARIANTS = {
  free: "secondary",
  occupied: "destructive",
  reserved: "outline",
} as const

export default async function TablesPage({
  params,
}: {
  params: Promise<{ branchId: string }>
}) {
  const { branchId } = await params
  const { session, branch } = await requireBranchAccess(branchId)
  const tables = await listTablesRequest(branchId)
  const canManage = can(session.role, "manageBranches")
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

      {canManage ? <TableCreateForm branchId={branchId} /> : null}

      {tables.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background p-8 text-center">
          <p className="text-sm font-medium">No tables yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? "Add the first table above. Dine-in orders will use it."
              : "Ask a manager to add tables for this branch."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tables.map((table) => (
            <div key={table.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-semibold">{table.label}</p>
                <Badge variant={STATUS_VARIANTS[table.status]}>
                  {tableStatusLabel(table.status)}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {table.seats} seat{table.seats === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
