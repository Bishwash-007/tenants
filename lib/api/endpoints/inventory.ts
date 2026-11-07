import "server-only"

import { apiFetch } from "@/lib/api/client"

export interface Supplier {
  id: string
  tenant_id: string
  name: string
  contact_phone: string | null
  contact_email: string | null
  created_at: string
}

export interface CreateSupplierInput {
  name: string
  contactPhone?: string | null
  contactEmail?: string | null
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>

export interface InventoryItem {
  id: string
  tenantId: string
  branchId: string
  name: string
  unit: string
  quantityOnHand: number
  reorderThreshold: number
  supplierId: string | null
}

export interface CreateInventoryItemInput {
  branchId: string
  name: string
  unit: string
  quantityOnHand?: number
  reorderThreshold?: number
  supplierId?: string | null
}

export interface StockMovement {
  id: string
  inventoryItemId: string
  movementType: string
  quantity: number
  referenceOrderId: string | null
  note: string | null
  createdBy: string
  createdAt: string
}

export interface Discrepancy {
  id: string
  tenant_id: string
  order_id: string
  status: string
  detail: string
  created_at: string
  updated_at: string
}

export function listSuppliersRequest(): Promise<Supplier[]> {
  return apiFetch<Supplier[]>("/inventory/suppliers")
}

export function getSupplierRequest(id: string): Promise<Supplier> {
  return apiFetch<Supplier>(`/inventory/suppliers/${id}`)
}

export function createSupplierRequest(
  input: CreateSupplierInput
): Promise<Supplier> {
  return apiFetch<Supplier>("/inventory/suppliers", {
    method: "POST",
    body: input,
  })
}

export function updateSupplierRequest(
  id: string,
  input: UpdateSupplierInput
): Promise<Supplier> {
  return apiFetch<Supplier>(`/inventory/suppliers/${id}`, {
    method: "PATCH",
    body: input,
  })
}

export function deleteSupplierRequest(id: string): Promise<void> {
  return apiFetch<void>(`/inventory/suppliers/${id}`, { method: "DELETE" })
}

export function listInventoryItemsRequest(
  branchId: string
): Promise<InventoryItem[]> {
  return apiFetch<InventoryItem[]>(
    `/inventory/items?branchId=${encodeURIComponent(branchId)}`
  )
}

export function getInventoryItemRequest(id: string): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(`/inventory/items/${id}`)
}

export function createInventoryItemRequest(
  input: CreateInventoryItemInput
): Promise<InventoryItem> {
  return apiFetch<InventoryItem>("/inventory/items", {
    method: "POST",
    body: input,
  })
}

export function stockInRequest(
  itemId: string,
  quantity: number,
  note?: string | null
): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(`/inventory/items/${itemId}/stock-in`, {
    method: "POST",
    body: { quantity, note },
  })
}

export function adjustStockRequest(
  itemId: string,
  quantity: number,
  note: string
): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(`/inventory/items/${itemId}/adjust`, {
    method: "POST",
    body: { quantity, note },
  })
}

export function listMovementsRequest(itemId: string): Promise<StockMovement[]> {
  return apiFetch<StockMovement[]>(`/inventory/items/${itemId}/movements`)
}

export function setReorderThresholdRequest(
  itemId: string,
  reorderThreshold: number
): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(
    `/inventory/items/${itemId}/reorder-threshold`,
    { method: "PATCH", body: { reorderThreshold } }
  )
}

export function attachRecipeIngredientRequest(
  branchId: string,
  menuItemId: string,
  inventoryItemId: string,
  quantityUsed: number
): Promise<void> {
  return apiFetch<void>(
    `/inventory/recipes/ingredients?branchId=${encodeURIComponent(branchId)}`,
    {
      method: "POST",
      body: { menuItemId, inventoryItemId, quantityUsed },
    }
  )
}

export function removeRecipeIngredientRequest(id: string): Promise<void> {
  return apiFetch<void>(`/inventory/recipes/ingredients/${id}`, {
    method: "DELETE",
  })
}

export function listDiscrepanciesRequest(
  status?: string
): Promise<Discrepancy[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ""
  return apiFetch<Discrepancy[]>(`/inventory/discrepancies${query}`)
}
