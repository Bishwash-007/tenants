import { Storefront } from "@phosphor-icons/react/dist/ssr"

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { SubscriptionBanner } from "@/components/layout/subscription-banner"
import { Topbar } from "@/components/layout/topbar"
import type { Branch } from "@/lib/api/types"
import type { Session } from "@/lib/auth/session"

interface DashboardShellProps {
  session: Session
  branches: Branch[]
  children: React.ReactNode
}

export function DashboardShell({
  session,
  branches,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-svh bg-muted/20">
      <aside className="flex w-14 shrink-0 flex-col border-r bg-background md:w-60">
        <div className="flex h-14 items-center gap-2 border-b px-3 md:px-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Storefront className="size-4" />
          </span>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-semibold">
              {session.tenant.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session.tenant.slug}
            </p>
          </div>
        </div>

        <div className="flex-1 py-2">
          <SidebarNav role={session.role} branches={branches} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar session={session} branches={branches} />
        <SubscriptionBanner status={session.subscription?.status ?? null} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
