import Link from "next/link"

import { requireBranchAccess } from "@/lib/auth/session"

const FUTURE_LINKS = [
  {
    label: "Orders",
    description: "Take orders and manage the service queue.",
    phase: "Phase 2",
  },
  {
    label: "Kitchen display",
    description: "Live ticket board for kitchen staff.",
    phase: "Phase 2",
  },
  {
    label: "Tables",
    description: "Table list and occupancy from active orders.",
    phase: "Phase 2",
  },
  {
    label: "Menu",
    description: "Categories, items, modifiers, and availability.",
    phase: "Phase 1",
  },
]

export default async function BranchOverviewPage({
  params,
}: {
  params: Promise<{ branchId: string }>
}) {
  const { branchId } = await params
  const { session, branch } = await requireBranchAccess(branchId)
  const isActive = (branch.is_active ?? branch.isActive) !== false

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Overview
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            {branch.name}
          </h1>
        </div>
        <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Address", branch.address ?? "—"],
          ["Phone", branch.phone ?? "—"],
          ["Timezone", branch.timezone ?? "—"],
          ["Your role", session.role.replaceAll("_", " ")],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-background p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-sm font-medium capitalize">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold">Next up</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FUTURE_LINKS.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border bg-background p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.label}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {item.phase}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Need to switch locations?{" "}
        <Link
          href="/branches"
          className="font-medium text-foreground underline underline-offset-4"
        >
          View all branches
        </Link>
        .
      </p>
    </div>
  )
}
