import Link from "next/link"

export function SubscriptionBlocked() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-lg font-semibold">Subscription inactive</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This workspace&apos;s subscription is cancelled, so the dashboard is
          unavailable. Billing stays accessible so an owner can review the
          account.
        </p>
        <Link
          href="/billing"
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Open billing
        </Link>
      </div>
    </main>
  )
}
