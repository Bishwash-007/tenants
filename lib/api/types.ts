import type { Role } from "@/lib/auth/rbac"

export type TenantStatus =
  "active" | "suspended" | "cancelled" | "pending" | (string & {})

export type SubscriptionStatus =
  "active" | "trialing" | "past_due" | "cancelled" | null | (string & {})

export interface AuthUser {
  userId: string
  tenantId: string
  branchId: string | null
  role: Role
  email: string
  fullName: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface CurrentUser extends AuthUser {
  isActive: boolean
  tenant: { name: string; slug: string; status: string }
  branch: { id: string; name: string; address: string | null } | null
  subscription?: { status: SubscriptionStatus }
}

/**
 * Branches are returned as raw database rows by the API: snake_case fields,
 * and optional columns depending on the migration version.
 */
export interface Branch {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  timezone?: string | null
  is_active?: boolean
  isActive?: boolean
  created_at?: string
  updated_at?: string
}

export type TableStatus = "free" | "occupied" | "reserved"

export interface Table {
  id: string
  tenant_id: string
  branch_id: string
  label: string
  seats: number
  status: TableStatus
  created_at: string
}

/**
 * `/menu/*` returns a rendered tree: categories containing items. Item `price`
 * is the base price plus every modifier; `basePrice` is the undecorated value.
 */
export interface MenuModifier {
  name: string
  optionName: string
  extraPrice: number
}

export interface MenuItem {
  kind: "item"
  id: string
  name: string
  branchId: string | null
  categoryId: string | null
  description: string | null
  basePrice: number
  price: number
  isAvailable: boolean
  imageUrl: string | null
  modifiers: MenuModifier[]
}

export interface MenuCategory {
  kind: "category"
  id: string
  name: string
  branchId: string | null
  sortOrder: number
  items: MenuItem[]
}

export type MenuNode = MenuCategory | MenuItem

/**
 * Write endpoints return the raw database row (snake_case), not the rendered
 * tree `GET /menu/*` returns. Keep them separate: a create response has no
 * `kind`, no nested `items`, and no decorated `price`.
 */
export interface MenuCategoryRow {
  id: string
  tenant_id: string
  branch_id: string | null
  name: string
  sort_order: number
  created_at: string
}

export interface MenuItemRow {
  id: string
  tenant_id: string
  branch_id: string | null
  category_id: string | null
  name: string
  description: string | null
  price: number
  is_available: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface MenuItemModifierRow {
  id: string
  tenant_id: string
  menu_item_id: string
  name: string
  option_name: string
  extra_price: number
}

export function isMenuCategory(node: MenuNode): node is MenuCategory {
  return node.kind === "category"
}

export function isMenuItem(node: MenuNode): node is MenuItem {
  return node.kind === "item"
}

export interface ApiErrorBody {
  statusCode?: number
  message?: string | string[]
  error?: string
}
