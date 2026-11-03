"use server"

import { revalidatePath } from "next/cache"

import {
  addModifierRequest,
  createCategoryRequest,
  createItemRequest,
  setItemAvailabilityRequest,
  updateItemRequest,
} from "@/lib/api/endpoints/menu"
import { sessionAllows, sessionAllowsBranch } from "@/lib/actions/guards"
import {
  errorState,
  invalidState,
  readText,
  successState,
  type ActionState,
} from "@/lib/actions/state"
import {
  addModifierSchema,
  createCategorySchema,
  menuItemSchema,
} from "@/lib/validation/menu"

/**
 * `scope=org` writes to the tenant-wide template; anything else writes to the
 * branch. The two capabilities map to different roles, and the API re-checks
 * both (including the item's own branch).
 */
async function allowsMenuWrite(
  scope: string,
  branchId: string
): Promise<boolean> {
  if (!branchId) {
    return false
  }

  return scope === "org"
    ? sessionAllows("manageOrgMenu")
    : sessionAllowsBranch("manageBranchMenu", branchId)
}

export async function createCategoryAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const branchId = readText(formData, "branchId")
  const scope = readText(formData, "scope")

  if (!(await allowsMenuWrite(scope, branchId))) {
    return {
      status: "error",
      message: "Your role cannot add categories here.",
    }
  }

  const parsed = createCategorySchema.safeParse({
    name: readText(formData, "name"),
    sortOrder: readText(formData, "sortOrder"),
  })

  if (!parsed.success) {
    return invalidState(parsed.error)
  }

  try {
    await createCategoryRequest(parsed.data, scope === "org" ? null : branchId)
    revalidatePath("/", "layout")
    return successState(`Category "${parsed.data.name}" created.`)
  } catch (error) {
    return errorState(error)
  }
}

export async function createItemAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const branchId = readText(formData, "branchId")
  const scope = readText(formData, "scope")

  if (!(await allowsMenuWrite(scope, branchId))) {
    return {
      status: "error",
      message: "Your role cannot add items here.",
    }
  }

  const parsed = menuItemSchema.safeParse({
    name: readText(formData, "name"),
    price: readText(formData, "price"),
    description: readText(formData, "description"),
    categoryId: readText(formData, "categoryId"),
  })

  if (!parsed.success) {
    return invalidState(parsed.error)
  }

  try {
    await createItemRequest(
      { ...parsed.data, isAvailable: true },
      scope === "org" ? null : branchId
    )
    revalidatePath("/", "layout")
    return successState(`Item "${parsed.data.name}" created.`)
  } catch (error) {
    return errorState(error)
  }
}

export async function updateItemAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const itemId = readText(formData, "itemId")

  if (!itemId) {
    return { status: "error", message: "Missing menu item." }
  }

  if (!(await sessionAllows("manageBranchMenu"))) {
    return { status: "error", message: "Your role cannot edit menu items." }
  }

  const parsed = menuItemSchema.safeParse({
    name: readText(formData, "name"),
    price: readText(formData, "price"),
    description: readText(formData, "description"),
    categoryId: readText(formData, "categoryId"),
  })

  if (!parsed.success) {
    return invalidState(parsed.error)
  }

  try {
    await updateItemRequest(itemId, parsed.data)
    revalidatePath("/", "layout")
    return successState("Item updated.")
  } catch (error) {
    return errorState(error)
  }
}

export async function setItemAvailabilityAction(
  itemId: string,
  isAvailable: boolean
): Promise<ActionState> {
  if (!(await sessionAllows("manageBranchMenu"))) {
    return { status: "error", message: "Your role cannot change availability." }
  }

  try {
    await setItemAvailabilityRequest(itemId, isAvailable)
    revalidatePath("/", "layout")
    return successState(
      isAvailable ? "Item is available again." : "Item hidden from the menu."
    )
  } catch (error) {
    return errorState(error)
  }
}

export async function addModifierAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const itemId = readText(formData, "itemId")

  if (!itemId) {
    return { status: "error", message: "Missing menu item." }
  }

  if (!(await sessionAllows("manageBranchMenu"))) {
    return { status: "error", message: "Your role cannot edit menu items." }
  }

  const parsed = addModifierSchema.safeParse({
    name: readText(formData, "name"),
    optionName: readText(formData, "optionName"),
    extraPrice: readText(formData, "extraPrice"),
  })

  if (!parsed.success) {
    return invalidState(parsed.error)
  }

  try {
    await addModifierRequest(itemId, parsed.data)
    revalidatePath("/", "layout")
    return successState(`Option "${parsed.data.optionName}" added.`)
  } catch (error) {
    return errorState(error)
  }
}
