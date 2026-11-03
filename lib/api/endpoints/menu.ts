import { apiFetch } from "@/lib/api/client"
import type {
  MenuCategoryRow,
  MenuItemModifierRow,
  MenuItemRow,
  MenuNode,
} from "@/lib/api/types"

export interface CreateCategoryInput {
  name: string
  sortOrder?: number
}

export interface CreateItemInput {
  name: string
  price: number
  description?: string | null
  isAvailable?: boolean
  imageUrl?: string | null
  categoryId?: string | null
}

export type UpdateItemInput = Partial<CreateItemInput>

export interface AddModifierInput {
  name: string
  optionName: string
  extraPrice: number
}

export function getBranchMenuRequest(branchId: string): Promise<MenuNode[]> {
  return apiFetch<MenuNode[]>(`/menu/branches/${branchId}`)
}

export function getOrgMenuRequest(): Promise<MenuNode[]> {
  return apiFetch<MenuNode[]>("/menu/org-wide")
}

export function createCategoryRequest(
  input: CreateCategoryInput,
  branchId: string | null
): Promise<MenuCategoryRow> {
  const path = branchId
    ? `/menu/branches/${branchId}/categories`
    : "/menu/categories"

  return apiFetch<MenuCategoryRow>(path, { method: "POST", body: input })
}

export function createItemRequest(
  input: CreateItemInput,
  branchId: string | null
): Promise<MenuItemRow> {
  const path = branchId ? `/menu/branches/${branchId}/items` : "/menu/items"

  return apiFetch<MenuItemRow>(path, { method: "POST", body: input })
}

export function updateItemRequest(
  itemId: string,
  input: UpdateItemInput
): Promise<MenuItemRow> {
  return apiFetch<MenuItemRow>(`/menu/items/${itemId}`, {
    method: "PATCH",
    body: input,
  })
}

export function setItemAvailabilityRequest(
  itemId: string,
  isAvailable: boolean
): Promise<MenuItemRow> {
  return apiFetch<MenuItemRow>(`/menu/items/${itemId}/availability`, {
    method: "PATCH",
    body: { isAvailable },
  })
}

export function addModifierRequest(
  itemId: string,
  input: AddModifierInput
): Promise<MenuItemModifierRow> {
  return apiFetch<MenuItemModifierRow>(`/menu/items/${itemId}/modifiers`, {
    method: "POST",
    body: input,
  })
}
