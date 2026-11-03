import { listKdsOrdersRequest } from "@/lib/api/endpoints/kds"
import { can } from "@/lib/auth/rbac"
import { requireBranchAccess } from "@/lib/auth/session"

import { OrdersClient } from "./orders-client"

interface OrdersPageProps {
  params: Promise<{ branchId: string }>
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { branchId } = await params
  const { session, branch } = await requireBranchAccess(branchId)

  if (!can(session.role, "viewOrders")) {
    return null
  }

  const orders = await listKdsOrdersRequest(branchId)

  return (
    <OrdersClient
      branchId={branchId}
      branchName={branch.name}
      initialOrders={orders}
      canTransition={can(session.role, "transitionOrder")}
      canCreate={can(session.role, "createOrder")}
    />
  )
}
