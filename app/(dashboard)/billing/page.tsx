import { getBillingSubscriptionRequest } from "@/lib/api/endpoints/billing"
import { requireRole } from "@/lib/auth/session"
import { env } from "@/lib/env"
import { formatMoney } from "@/lib/format/money"

function formatDate(value: string | null): string {
  if (!value) {
    return "—"
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value))
}

export default async function BillingPage() {
  await requireRole(["super_admin", "org_owner"])
  const subscription = await getBillingSubscriptionRequest()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Your workspace subscription. Guest payments are handled in Orders.
        </p>
      </div>

      {!subscription ? (
        <div className="rounded-xl border border-dashed bg-background p-6 text-sm text-muted-foreground">
          No subscription is attached to this workspace. <br />
          An org_owner can configure a plan in Phase 4.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="mt-1 text-sm font-medium capitalize">
                {subscription.status.replaceAll("_", " ")}
              </p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="mt-1 text-sm font-medium">
                {subscription.plan.name}
              </p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs text-muted-foreground">Monthly</p>
              <p className="mt-1 text-sm font-medium">
                {formatMoney(
                  subscription.plan.priceMonthly,
                  env.NEXT_PUBLIC_DEFAULT_CURRENCY
                )}
              </p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs text-muted-foreground">Renews</p>
              <p className="mt-1 text-sm font-medium">
                {formatDate(subscription.endsAt)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4">
            <h2 className="text-sm font-semibold">Plan limits</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {subscription.plan.maxBranches} branches ·{" "}
              {subscription.plan.maxStaff} staff seats
            </p>
          </div>
        </>
      )}

      <div className="rounded-xl border bg-background p-4">
        <h2 className="text-sm font-semibold">About this workspace</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Phase 4: Billing subscription management, payment provider
          configuration, and billing portal UI will appear here.
        </p>
      </div>
    </div>
  )
}
