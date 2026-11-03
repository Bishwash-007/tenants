import { requireBranchAccess } from "@/lib/auth/session"

export default async function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ branchId: string }>
}) {
  const { branchId } = await params
  await requireBranchAccess(branchId)

  return children
}
