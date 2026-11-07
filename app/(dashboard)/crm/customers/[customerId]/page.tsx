import { requireSession } from "@/lib/auth/session"
import {
  getCustomerRequest,
  getLoyaltyRequest,
} from "@/lib/api/endpoints/customers"

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  await requireSession()
  const [customer, loyalty] = await Promise.all([
    getCustomerRequest(customerId),
    getLoyaltyRequest(customerId).catch(() => null),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">
        {customer.full_name}
      </h1>
      <div className="space-y-2 rounded-xl border bg-background p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Phone</span>
          <span>{customer.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email</span>
          <span>{customer.email ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Birthday</span>
          <span>{customer.date_of_birth ?? "—"}</span>
        </div>
        {loyalty ? (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loyalty tier</span>
              <span>{loyalty.tier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Points</span>
              <span>{loyalty.points_balance}</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
