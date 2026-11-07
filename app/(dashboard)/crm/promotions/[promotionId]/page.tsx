import { requireSession } from "@/lib/auth/session"
import { getPromotionRequest } from "@/lib/api/endpoints/promotions"

export default async function PromotionDetailPage({
  params,
}: {
  params: Promise<{ promotionId: string }>
}) {
  const { promotionId } = await params
  await requireSession()
  const p = await getPromotionRequest(promotionId)

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">{p.code}</h1>
      <div className="space-y-2 rounded-xl border bg-background p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type</span>
          <span>{p.discount_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Value</span>
          <span>{p.discount_value}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Active</span>
          <span>{p.is_active ? "Yes" : "No"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Starts</span>
          <span>
            {p.starts_at ? new Date(p.starts_at).toLocaleString() : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ends</span>
          <span>{p.ends_at ? new Date(p.ends_at).toLocaleString() : "—"}</span>
        </div>
        {p.description ? (
          <p className="text-muted-foreground">{p.description}</p>
        ) : null}
      </div>
    </div>
  )
}
