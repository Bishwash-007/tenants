import "server-only"

import { apiFetch } from "@/lib/api/client"
import { listTablesRequest } from "@/lib/api/endpoints/tables"
import { normalizeOrderStatus } from "@/lib/kds/types"

export interface OrderItem {
  id: string
  menuItemId: string
  menuItemName: string
  quantity: number
  price: string
  notes: string | null
}

export interface Order {
  id: string
  branchId: string
  tableId: string | null
  tableLabel?: string | null
  status: string
  orderType: string
  subtotal: string
  taxAmount: string
  totalAmount: string
  items: OrderItem[]
  createdAt: string
}

export interface OrderListItem {
  id: string
  branchId: string
  tableId: string | null
  status: string
  orderType: string
  subtotal: string
  taxAmount: string
  totalAmount: string
  createdAt: string
}

/**
 * `/orders` answers with raw database rows: snake_case columns and money as
 * either a JSON number or a database numeric string. Normalize at the boundary
 * so pages never have to remember which casing a given route uses.
 */
interface OrderItemRow {
  id: string
  menu_item_id: string
  name: string
  quantity: number
  unit_price: string | number
  notes: string | null
}

interface OrderRow {
  id: string
  branch_id: string
  table_id: string | null
  status: string
  order_type: string
  subtotal: string | number
  tax_amount: string | number
  total_amount: string | number
  created_at: string
  items?: OrderItemRow[]
}

function toStatus(value: string): string {
  return normalizeOrderStatus(value) ?? value
}

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    menuItemName: row.name || "Unnamed item",
    quantity: row.quantity,
    price: String(row.unit_price),
    notes: row.notes,
  }
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    branchId: row.branch_id,
    tableId: row.table_id,
    status: toStatus(row.status),
    orderType: row.order_type,
    subtotal: String(row.subtotal),
    taxAmount: String(row.tax_amount),
    totalAmount: String(row.total_amount),
    items: (row.items ?? []).map(toOrderItem),
    createdAt: row.created_at,
  }
}

function toOrderListItem(row: OrderRow): OrderListItem {
  return {
    id: row.id,
    branchId: row.branch_id,
    tableId: row.table_id,
    status: toStatus(row.status),
    orderType: row.order_type,
    subtotal: String(row.subtotal),
    taxAmount: String(row.tax_amount),
    totalAmount: String(row.total_amount),
    createdAt: row.created_at,
  }
}

export async function listActiveOrdersRequest(
  branchId: string
): Promise<OrderListItem[]> {
  const rows = await apiFetch<OrderRow[]>(`/orders/branches/${branchId}/active`)

  return rows.map(toOrderListItem)
}

export async function getOrderRequest(orderId: string): Promise<Order> {
  const row = await apiFetch<OrderRow>(`/orders/${orderId}`)
  return toOrder(row)
}

export async function enrichOrderWithTableLabel(
  order: Order,
  branchId: string
): Promise<Order> {
  if (!order.tableId) {
    return { ...order, tableLabel: null }
  }

  const tables = await listTablesRequest(branchId)
  const label =
    tables.find((table) => table.id === order.tableId)?.label ?? null
  return { ...order, tableLabel: label }
}

export async function createOrderRequest(input: {
  branchId: string
  tableId?: string | null
  customerId?: string | null
  orderType?: string
  clientActionId?: string | null
  taxAmount?: number
  discountAmount?: number
  items: Array<{
    menuItemId: string
    quantity?: number
    notes?: string | null
    modifiers?: Array<{
      name: string
      optionName: string
      modifierId?: string
    }>
  }>
}): Promise<Order> {
  const row = await apiFetch<OrderRow>("/orders", {
    method: "POST",
    body: input,
  })

  return toOrder(row)
}

export async function transitionOrderRequest(
  orderId: string,
  status: string
): Promise<Order> {
  const row = await apiFetch<OrderRow>(`/orders/${orderId}/transition`, {
    method: "POST",
    body: { status },
  })

  return toOrder(row)
}
