import "server-only"

import { cache } from "react"
import { notFound, redirect } from "next/navigation"

import { getAccessToken } from "@/lib/auth/cookies"
import { listBranchesRequest } from "@/lib/api/endpoints/branches"
import { getCurrentUserRequest } from "@/lib/api/endpoints/auth"
import { getRequestPathname, getTenantSlug } from "@/lib/auth/request-context"
import {
  canAccessBranch,
  hasRole,
  isStaffRole,
  type Role,
} from "@/lib/auth/rbac"
import { ApiError, isSubscriptionBlocked } from "@/lib/api/errors"
import type { Branch, CurrentUser } from "@/lib/api/types"

export interface Session extends CurrentUser {
  tenantSlug: string
}

export const getSession = cache(async (): Promise<Session | null> => {
  const accessToken = await getAccessToken()
  const tenantSlug = await getTenantSlug()

  if (!accessToken || !tenantSlug) {
    return null
  }

  try {
    const user = await getCurrentUserRequest(accessToken, tenantSlug)

    if (!user.isActive || !isStaffRole(user.role)) {
      return null
    }

    return { ...user, tenantSlug }
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      return null
    }

    throw error
  }
})

export const getBranches = cache(async (): Promise<Branch[]> => {
  return listBranchesRequest()
})

function loginUrl(tenantSlug: string | null, nextPath: string | null): string {
  const params = new URLSearchParams()

  if (tenantSlug) {
    params.set("tenant", tenantSlug)
  }

  if (nextPath) {
    params.set("next", nextPath)
  }

  const query = params.toString()
  return query ? `/login?${query}` : "/login"
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()

  if (!session) {
    const tenantSlug = await getTenantSlug()
    const pathname = await getRequestPathname()
    redirect(loginUrl(tenantSlug, pathname))
  }

  return session
}

export async function requireRole(allowed: readonly Role[]): Promise<Session> {
  const session = await requireSession()

  if (!hasRole(session.role, allowed)) {
    redirect("/forbidden")
  }

  return session
}

export async function requireBranchAccess(branchId: string): Promise<{
  session: Session
  branch: Branch
}> {
  const session = await requireSession()

  if (!canAccessBranch(session.role, session.branchId, branchId)) {
    redirect("/forbidden")
  }

  let branches: Branch[]
  try {
    branches = await getBranches()
  } catch (error) {
    if (isSubscriptionBlocked(error)) {
      redirect("/billing")
    }
    throw error
  }

  const branch = branches.find((item) => item.id === branchId)

  if (!branch) {
    notFound()
  }

  return { session, branch }
}
