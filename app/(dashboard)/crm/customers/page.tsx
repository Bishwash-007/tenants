import { can } from "@/lib/auth/rbac"
import { requireSession } from "@/lib/auth/session"
import { listCustomersRequest } from "@/lib/api/endpoints/customers"

import { CustomersClient } from "./customers-client"

export default async function CustomersPage() {
  const session = await requireSession()
  const canManage = can(session.role, "manageCrm")
  const customers = (await listCustomersRequest().catch(() => []))
    .slice()
    .sort((a, b) =>
      String(a.full_name ?? "").localeCompare(String(b.full_name ?? ""))
    )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          {customers.length} customer{customers.length === 1 ? "" : "s"}
        </p>
      </div>
      <CustomersClient customers={customers} canManage={canManage} />
    </div>
  )
}
