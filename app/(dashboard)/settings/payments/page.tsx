import { requireRole } from "@/lib/auth/session"

export default async function PaymentSettingsPage() {
  await requireRole(["super_admin", "org_owner"])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Payment settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure the provider that turns an order into a payment QR.
        </p>
      </div>

      <div className="rounded-xl border border-dashed bg-background p-6">
        <h2 className="text-sm font-semibold">Provider configuration</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stripe, eSewa, and Razorpay configuration arrives in Phase 4. Secrets
          are write-only and will never be rendered back into the page.
        </p>
      </div>
    </div>
  )
}
