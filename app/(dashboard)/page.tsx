import { redirect } from "next/navigation"

import { isSubscriptionBlocked } from "@/lib/api/errors"
import type { Branch } from "@/lib/api/types"
import { getBranches } from "@/lib/auth/session"

export default async function DashboardIndexPage() {
  let branches: Branch[] = []

  try {
    branches = await getBranches()
  } catch (error) {
    if (isSubscriptionBlocked(error)) {
      redirect("/billing")
    }

    throw error
  }

  const firstBranch = branches[0]

  redirect(firstBranch ? `/b/${firstBranch.id}/overview` : "/branches")
}
