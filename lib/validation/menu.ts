import { z } from "zod"

import { optionalText } from "@/lib/validation/branches"

const optionalInteger = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce
      .number({ error: "Enter a whole number" })
      .int("Enter a whole number")
      .min(0, "Cannot be negative")
      .max(max, "Value is too large")
      .optional()
  )

const price = (label: string) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce
      .number({ error: `${label} must be a number` })
      .min(0, `${label} cannot be negative`)
      .max(1_000_000, `${label} is too large`)
  )

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(150, "Use 150 characters or fewer"),
  sortOrder: optionalInteger(100_000),
})

export const menuItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(150, "Use 150 characters or fewer"),
  price: price("Price"),
  description: optionalText(2000),
  categoryId: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.uuid("Choose a category")
  ),
})

export const addModifierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Modifier name is required")
    .max(100, "Use 100 characters or fewer"),
  optionName: z
    .string()
    .trim()
    .min(1, "Option name is required")
    .max(100, "Use 100 characters or fewer"),
  extraPrice: price("Extra price"),
})

export type CreateCategoryValues = z.infer<typeof createCategorySchema>
export type MenuItemValues = z.infer<typeof menuItemSchema>
export type AddModifierValues = z.infer<typeof addModifierSchema>
