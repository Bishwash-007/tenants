import { LoginForm } from "@/app/login/login-form"
import { getTenantSlug } from "@/lib/auth/request-context"

function safeNextPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/"
  }

  return candidate
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const tenantSlug = await getTenantSlug()
  const nextPath = safeNextPath(params.next)
  const sessionExpired = params.error === "session"

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            B
          </span>
          <h1 className="text-xl font-semibold tracking-tight">
            Sign in to Bliss
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your cafe, staff, and service.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
          {sessionExpired ? (
            <p
              role="status"
              className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
            >
              Your session expired. Please sign in again.
            </p>
          ) : null}

          <LoginForm defaultTenant={tenantSlug ?? ""} nextPath={nextPath} />
        </div>
      </div>
    </main>
  )
}
