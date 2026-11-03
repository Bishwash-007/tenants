"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  ChartBar,
  CreditCard,
  Gauge,
  Gear,
  GridFour,
  Heart,
  Monitor,
  Package,
  Receipt,
  Users,
} from "@phosphor-icons/react"

import { cn } from "cn"
import type { Branch } from "@/lib/api/types"
import { can, type Capability, type Role } from "@/lib/auth/rbac"

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string; weight?: "regular" }>
  capability: Capability
  segment: string
  branchScoped: boolean
  implemented: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    icon: Gauge,
    capability: "viewBranches",
    segment: "overview",
    branchScoped: true,
    implemented: true,
  },
  {
    label: "Orders",
    icon: Receipt,
    capability: "viewOrders",
    segment: "orders",
    branchScoped: true,
    implemented: true,
  },
  {
    label: "Kitchen",
    icon: Monitor,
    capability: "viewOrders",
    segment: "kds",
    branchScoped: true,
    implemented: true,
  },
  {
    label: "Tables",
    icon: GridFour,
    capability: "viewBranches",
    segment: "tables",
    branchScoped: true,
    implemented: true,
  },
  {
    label: "Menu",
    icon: BookOpen,
    capability: "viewMenu",
    segment: "menu",
    branchScoped: true,
    implemented: true,
  },
  {
    label: "Inventory",
    icon: Package,
    capability: "viewInventory",
    segment: "inventory",
    branchScoped: true,
    implemented: false,
  },
  {
    label: "Staff",
    icon: Users,
    capability: "viewStaff",
    segment: "staff",
    branchScoped: true,
    implemented: false,
  },
  {
    label: "Reports",
    icon: ChartBar,
    capability: "viewReports",
    segment: "reports",
    branchScoped: true,
    implemented: false,
  },
  {
    label: "Branches",
    icon: GridFour,
    capability: "viewBranches",
    segment: "branches",
    branchScoped: false,
    implemented: true,
  },
  {
    label: "CRM",
    icon: Heart,
    capability: "viewCrm",
    segment: "crm",
    branchScoped: false,
    implemented: false,
  },
  {
    label: "Billing",
    icon: CreditCard,
    capability: "viewBilling",
    segment: "billing",
    branchScoped: false,
    implemented: true,
  },
  {
    label: "Settings",
    icon: Gear,
    capability: "managePaymentConfig",
    segment: "settings/payments",
    branchScoped: false,
    implemented: true,
  },
]

interface SidebarNavProps {
  role: Role
  branches: Branch[]
}

export function SidebarNav({ role, branches }: SidebarNavProps) {
  const pathname = usePathname()
  const currentBranchId =
    pathname.match(/^\/b\/([^/]+)/)?.[1] ?? branches[0]?.id ?? null

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      {NAV_ITEMS.filter((item) => can(role, item.capability)).map((item) => {
        const href = item.branchScoped
          ? currentBranchId
            ? `/b/${currentBranchId}/${item.segment}`
            : null
          : `/${item.segment}`

        if (!item.implemented || !href) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              title={item.implemented ? "No branch available" : "Coming soon"}
              className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground/50"
            >
              <item.icon className="size-4 shrink-0" />
              <span className="hidden truncate md:inline">{item.label}</span>
            </span>
          )
        }

        const isActive = pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={item.label}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="hidden truncate md:inline">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
