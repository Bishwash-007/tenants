import "server-only"

import { can, canAccessBranch, type Capability } from "@/lib/auth/rbac"
import { requireSession } from "@/lib/auth/session"

export async function sessionAllows(capability: Capability): Promise<boolean> {
  const session = await requireSession()
  return can(session.role, capability)
}

/** Both the role and the branch scope must allow the write. */
export async function sessionAllowsBranch(
  capability: Capability,
  branchId: string
): Promise<boolean> {
  const session = await requireSession()

  return (
    can(session.role, capability) &&
    canAccessBranch(session.role, session.branchId, branchId)
  )
}
