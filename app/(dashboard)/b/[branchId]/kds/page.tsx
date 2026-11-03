import { listKdsOrdersRequest } from "@/lib/api/endpoints/kds"
import { requireBranchAccess } from "@/lib/auth/session"
import { can } from "@/lib/auth/rbac"

import { KDSClient } from "./kds-client"

interface KDSPageProps {
  params: Promise<{ branchId: string }>
}

export default async function KDSPage({ params }: KDSPageProps) {
  const { branchId } = await params
  const { session, branch } = await requireBranchAccess(branchId)

  if (!can(session.role, "viewOrders")) {
    return null
  }

  const orders = await listKdsOrdersRequest(branchId)

  return (
    <KDSClient
      branchId={branchId}
      branchName={branch.name}
      initialOrders={orders}
    />
  )
}
