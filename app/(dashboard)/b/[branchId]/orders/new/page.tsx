import { getBranchMenuRequest } from "@/lib/api/endpoints/menu"
import { listTablesRequest } from "@/lib/api/endpoints/tables"
import { requireBranchAccess } from "@/lib/auth/session"
import { isMenuCategory } from "@/lib/api/types"

import { POSClient } from "./pos-client"

interface POSPageProps {
  params: Promise<{ branchId: string }>
}

export default async function POSPage({ params }: POSPageProps) {
  const { branchId } = await params
  await requireBranchAccess(branchId)
  const menu = await getBranchMenuRequest(branchId)
  const tables = await listTablesRequest(branchId)
  const categories = menu.filter(isMenuCategory)
  const freeTables = tables.filter((t) => t.status === "free")

  return (
    <POSClient
      branchId={branchId}
      initialCategories={categories}
      initialTables={freeTables}
    />
  )
}
