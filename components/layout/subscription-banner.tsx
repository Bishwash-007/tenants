import Link from "next/link"

import type { SubscriptionStatus } from "@/lib/api/types"

interface SubscriptionBannerProps {
  status: SubscriptionStatus | null
}

export function SubscriptionBanner({ status }: SubscriptionBannerProps) {
  if (status !== "past_due") {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-200">
      <p>
        Your subscription payment failed. The workspace is read-only until it is
        settled.
      </p>
      <Link
        href="/billing"
        className="font-medium underline underline-offset-4"
      >
        Go to billing
      </Link>
    </div>
  )
}
