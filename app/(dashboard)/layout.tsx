import { SessionKeeper } from "@/components/auth/session-keeper"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { SubscriptionBlocked } from "@/components/layout/subscription-blocked"
import { isSubscriptionBlocked } from "@/lib/api/errors"
import type { Branch } from "@/lib/api/types"
import { getRequestPathname } from "@/lib/auth/request-context"
import { getBranches, requireSession } from "@/lib/auth/session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireSession()
  const pathname = await getRequestPathname()
  const isBillingPath = pathname?.startsWith("/billing") ?? false
  const subscriptionStatus = session.subscription?.status

  if (subscriptionStatus === "cancelled" && !isBillingPath) {
    return <SubscriptionBlocked />
  }

  let branches: Branch[] = []

  try {
    branches = await getBranches()
  } catch (error) {
    if (isSubscriptionBlocked(error)) {
      if (!isBillingPath) {
        return <SubscriptionBlocked />
      }
    } else {
      throw error
    }
  }

  return (
    <>
      <SessionKeeper />
      <DashboardShell session={session} branches={branches}>
        {children}
      </DashboardShell>
    </>
  )
}
