import { can } from "@/lib/auth/rbac"
import { requireBranchAccess } from "@/lib/auth/session"
import {
  getPayrollRequest,
  getRosterRequest,
  listShiftsRequest,
} from "@/lib/api/endpoints/staff"

import { StaffClient } from "./staff-client"

export default async function StaffPage({
  params,
}: {
  params: Promise<{ branchId: string }>
}) {
  const { branchId } = await params
  const { session } = await requireBranchAccess(branchId)
  const canManage = can(session.role, "manageStaff")
  const canViewPayroll = can(session.role, "manageStaff")

  const [shifts, roster, payroll] = await Promise.all([
    listShiftsRequest(branchId)
      .catch(() => [])
      .then((list) =>
        list
          .slice()
          .sort((a, b) =>
            String(a.start_time ?? "").localeCompare(String(b.start_time ?? ""))
          )
      ),
    getRosterRequest(branchId).catch(() => null),
    canViewPayroll
      ? getPayrollRequest(branchId).catch(() => null)
      : Promise.resolve(null),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Staff</h1>
        <p className="text-sm text-muted-foreground">
          {shifts.length} shift{shifts.length === 1 ? "" : "s"} · roster &amp;
          payroll
        </p>
      </div>

      <StaffClient
        branchId={branchId}
        shifts={shifts}
        roster={roster}
        payroll={payroll}
        canManage={canManage}
        canViewPayroll={canViewPayroll}
      />
    </div>
  )
}
