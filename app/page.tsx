import { redirect } from "next/navigation"

import { getBranches, getSession } from "@/lib/auth/session"
import { LandingContent } from "@/components/landing/landing-content"

export default async function LandingPage() {
  const session = await getSession()

  if (session) {
    let firstBranchId: string | null = null
    try {
      const branches = await getBranches()
      firstBranchId = branches[0]?.id ?? null
    } catch {
      firstBranchId = null
    }

    redirect(firstBranchId ? `/b/${firstBranchId}/overview` : "/branches")
  }

  return <LandingContent />
}
