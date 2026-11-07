import { can } from "@/lib/auth/rbac"
import { requireSession } from "@/lib/auth/session"
import { listPromotionsRequest } from "@/lib/api/endpoints/promotions"

import { PromotionsClient } from "./promotions-client"

export default async function PromotionsPage() {
  const session = await requireSession()
  const canManage = can(session.role, "managePromotions")
  const canAnnounce = can(session.role, "announcePromotions")
  const promotions = (await listPromotionsRequest().catch(() => []))
    .slice()
    .sort((a, b) => String(a.code ?? "").localeCompare(String(b.code ?? "")))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Promotions</h1>
        <p className="text-sm text-muted-foreground">
          {promotions.length} promotion{promotions.length === 1 ? "" : "s"}
        </p>
      </div>
      <PromotionsClient
        promotions={promotions}
        canManage={canManage}
        canAnnounce={canAnnounce}
      />
    </div>
  )
}
