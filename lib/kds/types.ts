/**
 * Shared KDS vocabulary. Kept out of `lib/api` because the client component
 * needs the labels, transitions and age formatting too — importing anything
 * from `lib/api` would drag `server-only` into the browser bundle.
 */

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "awaiting_payment"
  | "paid"
  | "completed"
  | "cancelled"

export const STATUS_SEQUENCE: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "awaiting_payment",
  "paid",
  "completed",
  "cancelled",
]

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  completed: "Completed",
  cancelled: "Cancelled",
}

export const STATUS_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  placed: "secondary",
  confirmed: "default",
  preparing: "default",
  ready: "default",
  served: "secondary",
  awaiting_payment: "default",
  paid: "secondary",
  completed: "outline",
  cancelled: "destructive",
}

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["completed"],
  completed: [],
  cancelled: [],
}

export const statusRank: Record<OrderStatus, number> = STATUS_SEQUENCE.reduce(
  (ranks, status, index) => {
    ranks[status] = index
    return ranks
  },
  {} as Record<OrderStatus, number>
)

/** Imperative labels for the sheet's action buttons, one per transition target. */
export const TRANSITION_LABELS: Record<OrderStatus, string> = {
  placed: "Reopen",
  confirmed: "Confirm",
  preparing: "Start preparing",
  ready: "Mark ready",
  served: "Mark served",
  awaiting_payment: "Request payment",
  paid: "Mark paid",
  completed: "Complete",
  cancelled: "Cancel order",
}

/**
 * Older seed rows used `serving` before the state machine settled on `served`.
 * The alias keeps their badge, rank and transitions coherent.
 */
const STATUS_ALIASES: Record<string, OrderStatus> = {
  serving: "served",
}

/**
 * Narrows an untrusted status to the lifecycle set, resolving legacy aliases.
 * `null` means the row carries a status this UI has no vocabulary for.
 */
export function normalizeOrderStatus(value: string): OrderStatus | null {
  const normalized = STATUS_ALIASES[value] ?? value

  return (STATUS_SEQUENCE as string[]).includes(normalized)
    ? (normalized as OrderStatus)
    : null
}

// The helpers below tolerate an unknown status so a row written by an older
// server version still renders as text instead of an empty badge.
export function statusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] ?? status
}

export function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  return STATUS_VARIANTS[status as OrderStatus] ?? "outline"
}

export function statusSortRank(status: string): number {
  return statusRank[status as OrderStatus] ?? STATUS_SEQUENCE.length
}

export interface KDSOrderModifier {
  /** The option snapshot, e.g. "Large" — the group is not stored on the line. */
  name: string
  extraPrice: number
}

export interface KDSOrderItem {
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
  notes: string | null
  modifiers: KDSOrderModifier[]
}

export interface KDSOrder {
  id: string
  branchId: string
  status: OrderStatus
  orderType: string
  tableId: string | null
  tableLabel?: string | null
  totalAmount: number
  items: KDSOrderItem[]
  /** ISO-8601 timestamp of creation — drives the age column. */
  occurredAt: string
}

/**
 * `order.status_changed` payload from the API. It intentionally carries no
 * items: the gateway emits the domain event, and a ticket's lines are fetched
 * separately when the display has not seen them yet.
 */
export interface KDSStatusChangedEvent {
  orderId: string
  newStatus: OrderStatus
  previousStatus: OrderStatus | null
  branchId: string
  tableId: string | null
  orderType: string
  totalAmount: number
  occurredAt: string
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: "Dine in",
  takeaway: "Takeaway",
  delivery: "Delivery",
}

export function orderTypeLabel(value: string): string {
  return ORDER_TYPE_LABELS[value] ?? value
}

/** Coarse relative age; a kitchen display only needs minutes and hours. */
export function formatAge(occurredAt: string, now = Date.now()): string {
  const then = new Date(occurredAt).getTime()

  if (!Number.isFinite(then)) {
    return "—"
  }

  const diff = Math.max(0, now - then)

  if (diff < 60_000) {
    return `${Math.floor(diff / 1000)}s ago`
  }

  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)}m ago`
  }

  return `${Math.floor(diff / 3_600_000)}h ago`
}
