import { BranchSwitcher } from "@/components/layout/branch-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"
import type { Branch } from "@/lib/api/types"
import type { Session } from "@/lib/auth/session"

interface TopbarProps {
  session: Session
  branches: Branch[]
}

export function Topbar({ session, branches }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden truncate text-xs font-medium tracking-wide text-muted-foreground uppercase lg:inline">
          {session.tenant.name}
        </span>
        <span className="hidden text-muted-foreground/40 lg:inline">/</span>
        <BranchSwitcher branches={branches} />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <UserMenu
          fullName={session.fullName}
          email={session.email}
          role={session.role}
        />
      </div>
    </header>
  )
}
