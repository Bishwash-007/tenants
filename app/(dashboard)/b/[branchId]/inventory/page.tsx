import { can } from "@/lib/auth/rbac"
import { requireBranchAccess } from "@/lib/auth/session"
import {
  listDiscrepanciesRequest,
  listInventoryItemsRequest,
  listSuppliersRequest,
} from "@/lib/api/endpoints/inventory"
import { getBranchMenuRequest } from "@/lib/api/endpoints/menu"

import { InventoryClient } from "./inventory-client"

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ branchId: string }>
}) {
  const { branchId } = await params
  const { session } = await requireBranchAccess(branchId)
  const canManage = can(session.role, "manageInventory")
  const [items, suppliers, discrepancies, menu] = await Promise.all([
    listInventoryItemsRequest(branchId)
      .catch(() => [])
      .then((list) =>
        list
          .slice()
          .sort((a, b) =>
            String(a.name ?? "").localeCompare(String(b.name ?? ""))
          )
      ),
    listSuppliersRequest()
      .catch(() => [])
      .then((list) =>
        list
          .slice()
          .sort((a, b) =>
            String(a.name ?? "").localeCompare(String(b.name ?? ""))
          )
      ),
    listDiscrepanciesRequest().catch(() => []),
    getBranchMenuRequest(branchId).catch(() => []),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} ·{" "}
          {suppliers.length} supplier
          {suppliers.length === 1 ? "" : "s"} · {discrepancies.length}{" "}
          discrepanc
          {discrepancies.length === 1 ? "y" : "ies"}
        </p>
      </div>

      <InventoryClient
        branchId={branchId}
        items={items}
        suppliers={suppliers}
        discrepancies={discrepancies}
        menu={menu}
        canManage={canManage}
      />
    </div>
  )
}
