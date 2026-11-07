"use server"

import { revalidatePath } from "next/cache"

import type { StockMovement } from "@/lib/api/endpoints/inventory"
import {
  adjustStockRequest,
  attachRecipeIngredientRequest,
  createInventoryItemRequest,
  createSupplierRequest,
  deleteSupplierRequest,
  listMovementsRequest,
  setReorderThresholdRequest,
  stockInRequest,
  updateSupplierRequest,
} from "@/lib/api/endpoints/inventory"
import { sessionAllows, sessionAllowsBranch } from "@/lib/actions/guards"
import {
  errorState,
  invalidState,
  readText,
  successState,
  type ActionState,
} from "@/lib/actions/state"
import {
  adjustStockSchema,
  inventoryItemSchema,
  reorderThresholdSchema,
  stockInSchema,
  supplierSchema,
} from "@/lib/validation/inventory"

export async function createSupplierAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await sessionAllows("manageInventory"))) {
    return { status: "error", message: "Your role cannot manage suppliers." }
  }

  const parsed = supplierSchema.safeParse({
    name: readText(formData, "name"),
    contactPhone: readText(formData, "contactPhone"),
    contactEmail: readText(formData, "contactEmail"),
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await createSupplierRequest(parsed.data)
    revalidatePath("/", "layout")
    return successState(`Supplier "${parsed.data.name}" created.`)
  } catch (error) {
    return errorState(error)
  }
}

export async function updateSupplierAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = readText(formData, "id")
  if (!id) return { status: "error", message: "Missing supplier." }
  if (!(await sessionAllows("manageInventory"))) {
    return { status: "error", message: "Your role cannot manage suppliers." }
  }

  const parsed = supplierSchema.safeParse({
    name: readText(formData, "name"),
    contactPhone: readText(formData, "contactPhone"),
    contactEmail: readText(formData, "contactEmail"),
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await updateSupplierRequest(id, parsed.data)
    revalidatePath("/", "layout")
    return successState("Supplier updated.")
  } catch (error) {
    return errorState(error)
  }
}

export async function deleteSupplierAction(id: string): Promise<ActionState> {
  if (!(await sessionAllows("manageInventory"))) {
    return { status: "error", message: "Your role cannot manage suppliers." }
  }
  try {
    await deleteSupplierRequest(id)
    revalidatePath("/", "layout")
    return successState("Supplier deleted.")
  } catch (error) {
    return errorState(error)
  }
}

export async function createInventoryItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const branchId = readText(formData, "branchId")
  if (!(await sessionAllowsBranch("manageInventory", branchId))) {
    return {
      status: "error",
      message: "Your role cannot manage inventory here.",
    }
  }

  const parsed = inventoryItemSchema.safeParse({
    name: readText(formData, "name"),
    unit: readText(formData, "unit"),
    quantityOnHand: readText(formData, "quantityOnHand"),
    reorderThreshold: readText(formData, "reorderThreshold"),
    supplierId: readText(formData, "supplierId"),
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await createInventoryItemRequest({ branchId, ...parsed.data })
    revalidatePath("/", "layout")
    return successState(`Item "${parsed.data.name}" created.`)
  } catch (error) {
    return errorState(error)
  }
}

export async function stockInAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const itemId = readText(formData, "itemId")
  const branchId = readText(formData, "branchId")
  if (!(await sessionAllowsBranch("manageInventory", branchId))) {
    return {
      status: "error",
      message: "Your role cannot manage inventory here.",
    }
  }

  const parsed = stockInSchema.safeParse({
    quantity: readText(formData, "quantity"),
    note: readText(formData, "note"),
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await stockInRequest(itemId, parsed.data.quantity, parsed.data.note ?? null)
    revalidatePath("/", "layout")
    return successState("Stock received.")
  } catch (error) {
    return errorState(error)
  }
}

export async function adjustStockAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const itemId = readText(formData, "itemId")
  const branchId = readText(formData, "branchId")
  if (!(await sessionAllowsBranch("manageInventory", branchId))) {
    return {
      status: "error",
      message: "Your role cannot manage inventory here.",
    }
  }

  const parsed = adjustStockSchema.safeParse({
    quantity: readText(formData, "quantity"),
    note: readText(formData, "note"),
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await adjustStockRequest(itemId, parsed.data.quantity, parsed.data.note)
    revalidatePath("/", "layout")
    return successState("Stock adjusted.")
  } catch (error) {
    return errorState(error)
  }
}

export async function setReorderThresholdAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const itemId = readText(formData, "itemId")
  const branchId = readText(formData, "branchId")
  if (!(await sessionAllowsBranch("manageInventory", branchId))) {
    return {
      status: "error",
      message: "Your role cannot manage inventory here.",
    }
  }

  const parsed = reorderThresholdSchema.safeParse({
    reorderThreshold: readText(formData, "reorderThreshold"),
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await setReorderThresholdRequest(itemId, parsed.data.reorderThreshold)
    revalidatePath("/", "layout")
    return successState("Reorder threshold updated.")
  } catch (error) {
    return errorState(error)
  }
}

export async function listMovementsAction(
  itemId: string
): Promise<StockMovement[]> {
  if (!(await sessionAllows("viewInventory"))) {
    return []
  }
  try {
    return await listMovementsRequest(itemId)
  } catch {
    return []
  }
}

export async function attachRecipeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const branchId = readText(formData, "branchId")
  if (!(await sessionAllowsBranch("manageInventory", branchId))) {
    return {
      status: "error",
      message: "Your role cannot manage inventory here.",
    }
  }

  const parsed = (
    await import("@/lib/validation/inventory")
  ).recipeIngredientSchema.safeParse({
    menuItemId: readText(formData, "menuItemId"),
    inventoryItemId: readText(formData, "inventoryItemId"),
    quantityUsed: readText(formData, "quantityUsed"),
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await attachRecipeIngredientRequest(
      branchId,
      parsed.data.menuItemId,
      parsed.data.inventoryItemId,
      parsed.data.quantityUsed
    )
    revalidatePath("/", "layout")
    return successState("Recipe ingredient attached.")
  } catch (error) {
    return errorState(error)
  }
}
