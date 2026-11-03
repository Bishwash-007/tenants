import "server-only"

import { apiFetch } from "@/lib/api/client"
import { listTablesRequest } from "@/lib/api/endpoints/tables"
import {
  normalizeOrderStatus,
  type KDSOrder,
  type KDSOrderItem,
  type OrderStatus,
} from "@/lib/kds/types"

/**
 * The orders API returns raw database rows (snake_case, money as JSON
 * numbers). The KDS wants one normalized shape with item lines, so this module
 * is the only place that knows the wire format.
 */

interface KdsItemRow {
  menu_item_id: string
  name: string
  quantity: number
  unit_price: string | number
  notes: string | null
  modifiers: Array<{ name: string; extra_price: string | number }>
}

interface KdsOrderRow {
  id: string
  status: string
  order_type: string
  branch_id?: string
  table_id: string | null
  total_amount: string | number
  created_at: string
  items?: KdsItemRow[]
}

function toItem(row: KdsItemRow): KDSOrderItem {
  return {
    menuItemId: row.menu_item_id,
    name: row.name || "Unnamed item",
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    notes: row.notes,
    modifiers: (row.modifiers ?? []).map((modifier) => ({
      name: modifier.name,
      extraPrice: Number(modifier.extra_price),
    })),
  }
}

/**
 * Some older seed rows use `serving` where the state machine says `served`.
 * Normalizing here keeps the board's status badge, sort rank and transitions
 * coherent instead of rendering an unknown lifecycle state.
 */
function toStatus(value: string): OrderStatus {
  return normalizeOrderStatus(value) ?? (value as OrderStatus)
}

function toOrder(
  row: KdsOrderRow,
  items: KdsItemRow[],
  branchId?: string
): KDSOrder {
  return {
    id: row.id,
    branchId: row.branch_id ?? branchId ?? "",
    status: toStatus(row.status),
    orderType: row.order_type,
    tableId: row.table_id,
    totalAmount: Number(row.total_amount),
    items: items.map(toItem),
    occurredAt: row.created_at,
  }
}

/**
 * `GET /orders/:id` is the only endpoint that includes item lines. The active
 * list is a header-only projection, so each ticket is hydrated individually.
 * A detail failure must not drop the ticket from the board — it still shows up
 * without lines and the sheet explains that they are loading.
 */
export async function getKdsOrderRequest(orderId: string): Promise<KDSOrder> {
  const row = await apiFetch<KdsOrderRow>(`/orders/${orderId}`)
  return toOrder(row, row.items ?? [])
}

export async function listKdsOrdersRequest(
  branchId: string
): Promise<KDSOrder[]> {
  const rows = await apiFetch<KdsOrderRow[]>(
    `/orders/branches/${branchId}/active`
  )

  const orders = await Promise.all(
    rows.map((row) => getKdsOrderRequest(row.id).catch(() => toOrder(row, [])))
  )

  const tables = await listTablesRequest(branchId)
  const labels = new Map(tables.map((table) => [table.id, table.label]))

  return orders.map((order) => ({
    ...order,
    tableLabel: order.tableId ? (labels.get(order.tableId) ?? null) : null,
  }))
}

export async function enrichKdsOrderWithTableLabel(
  order: KDSOrder,
  branchId: string
): Promise<KDSOrder> {
  if (!order.tableId || !branchId) {
    return { ...order, tableLabel: null }
  }

  const tables = await listTablesRequest(branchId)
  const label =
    tables.find((table) => table.id === order.tableId)?.label ?? null
  return { ...order, tableLabel: label }
}
