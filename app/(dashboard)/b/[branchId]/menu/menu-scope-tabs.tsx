import Link from "next/link"

import { cn } from "cn"

interface MenuScopeTabsProps {
  branchId: string
  scope: "branch" | "org"
  canOrg: boolean
}

export function MenuScopeTabs({ branchId, scope, canOrg }: MenuScopeTabsProps) {
  if (!canOrg) {
    return null
  }

  const tabs = [
    { value: "branch", label: "This branch", href: `/b/${branchId}/menu` },
    {
      value: "org",
      label: "Org-wide template",
      href: `/b/${branchId}/menu?scope=org`,
    },
  ] as const

  return (
    <div className="inline-flex items-center rounded-lg bg-muted p-[3px] text-muted-foreground">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          aria-current={scope === tab.value ? "page" : undefined}
          className={cn(
            "inline-flex h-7 items-center rounded-md px-2.5 text-sm transition-colors",
            scope === tab.value
              ? "bg-background font-medium text-foreground shadow-sm"
              : "hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
