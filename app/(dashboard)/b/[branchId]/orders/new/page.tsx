import { getBranchMenuRequest } from "@/lib/api/endpoints/menu"
import { listTablesRequest } from "@/lib/api/endpoints/tables"
import { requireBranchAccess } from "@/lib/auth/session"
import { isMenuCategory } from "@/lib/api/types"

import { POSClient } from "./pos-client"

interface POSPageProps {
  params: Promise<{ branchId: string }>
  searchParams: Promise<{ tableId?: string }>
}

export default async function POSPage({ params, searchParams }: POSPageProps) {
  const { branchId } = await params
  const { tableId } = await searchParams
  await requireBranchAccess(branchId)
  const menu = await getBranchMenuRequest(branchId)
  const tables = await listTablesRequest(branchId)
  const categories = menu.filter(isMenuCategory)

  return (
    <POSClient
      branchId={branchId}
      initialCategories={categories}
      initialTables={tables.map(({ id, label, seats, status }) => ({
        id,
        label,
        seats,
        status,
      }))}
      initialTableId={tableId ?? null}
    />
  )
}
