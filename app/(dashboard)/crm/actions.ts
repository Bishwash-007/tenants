"use server"

import { revalidatePath } from "next/cache"

import {
  announceBirthdaysRequest,
  createCustomerRequest,
  updateCustomerRequest,
} from "@/lib/api/endpoints/customers"
import {
  announcePromotionRequest,
  createPromotionRequest,
  updatePromotionRequest,
} from "@/lib/api/endpoints/promotions"
import { sessionAllows } from "@/lib/actions/guards"
import {
  errorState,
  invalidState,
  readText,
  successState,
  type ActionState,
} from "@/lib/actions/state"
import {
  customerSchema,
  customerUpdateSchema,
  promotionSchema,
} from "@/lib/validation/crm"

export async function createCustomerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await sessionAllows("manageCrm"))) {
    return { status: "error", message: "Your role cannot manage customers." }
  }

  const parsed = customerSchema.safeParse({
    phone: readText(formData, "phone"),
    fullName: readText(formData, "fullName"),
    email: readText(formData, "email"),
    dateOfBirth: readText(formData, "dateOfBirth"),
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    const customer = await createCustomerRequest({
      phone: parsed.data.phone,
      fullName: parsed.data.fullName,
      email: parsed.data.email ?? null,
      dateOfBirth: parsed.data.dateOfBirth ?? null,
    })
    revalidatePath("/", "layout")
    return successState(`Customer saved (${customer.id.slice(0, 8)}).`)
  } catch (error) {
    return errorState(error)
  }
}

export async function updateCustomerBirthdayAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = readText(formData, "id")
  if (!id) return { status: "error", message: "Missing customer." }
  if (!(await sessionAllows("manageCrm"))) {
    return { status: "error", message: "Your role cannot manage customers." }
  }

  const parsed = customerUpdateSchema.safeParse({
    dateOfBirth: readText(formData, "dateOfBirth") || null,
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await updateCustomerRequest(id, {
      dateOfBirth: parsed.data.dateOfBirth ?? null,
    })
    revalidatePath("/", "layout")
    return successState("Customer updated.")
  } catch (error) {
    return errorState(error)
  }
}

export async function announceBirthdaysAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await sessionAllows("announcePromotions"))) {
    return { status: "error", message: "Your role cannot announce birthdays." }
  }
  const date = readText(formData, "date") || undefined
  try {
    const result = await announceBirthdaysRequest(date)
    revalidatePath("/", "layout")
    return successState(
      `Published ${result.published} birthday notification(s).`
    )
  } catch (error) {
    return errorState(error)
  }
}

export async function createPromotionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await sessionAllows("managePromotions"))) {
    return { status: "error", message: "Your role cannot manage promotions." }
  }

  const parsed = promotionSchema.safeParse({
    code: readText(formData, "code"),
    description: readText(formData, "description"),
    discountType: readText(formData, "discountType"),
    discountValue: readText(formData, "discountValue"),
    startsAt: readText(formData, "startsAt"),
    endsAt: readText(formData, "endsAt"),
    isActive: readText(formData, "isActive") === "on",
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await createPromotionRequest({
      code: parsed.data.code,
      description: parsed.data.description ?? null,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      startsAt: parsed.data.startsAt ?? null,
      endsAt: parsed.data.endsAt ?? null,
      isActive: parsed.data.isActive,
    })
    revalidatePath("/", "layout")
    return successState(`Promotion "${parsed.data.code}" created.`)
  } catch (error) {
    return errorState(error)
  }
}

export async function updatePromotionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = readText(formData, "id")
  if (!id) return { status: "error", message: "Missing promotion." }
  if (!(await sessionAllows("managePromotions"))) {
    return { status: "error", message: "Your role cannot manage promotions." }
  }

  const parsed = promotionSchema.safeParse({
    code: readText(formData, "code"),
    description: readText(formData, "description"),
    discountType: readText(formData, "discountType"),
    discountValue: readText(formData, "discountValue"),
    startsAt: readText(formData, "startsAt"),
    endsAt: readText(formData, "endsAt"),
    isActive: readText(formData, "isActive") === "on",
  })
  if (!parsed.success) return invalidState(parsed.error)

  try {
    await updatePromotionRequest(id, {
      code: parsed.data.code,
      description: parsed.data.description ?? null,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      startsAt: parsed.data.startsAt ?? null,
      endsAt: parsed.data.endsAt ?? null,
      isActive: parsed.data.isActive,
    })
    revalidatePath("/", "layout")
    return successState("Promotion updated.")
  } catch (error) {
    return errorState(error)
  }
}

export async function announcePromotionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = readText(formData, "id")
  if (!id) return { status: "error", message: "Missing promotion." }
  if (!(await sessionAllows("announcePromotions"))) {
    return { status: "error", message: "Your role cannot announce promotions." }
  }
  try {
    const result = await announcePromotionRequest(id)
    revalidatePath("/", "layout")
    return successState(`Published ${result.published} notification(s).`)
  } catch (error) {
    return errorState(error)
  }
}
