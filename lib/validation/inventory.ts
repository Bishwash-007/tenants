import { z } from "zod"

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  contactPhone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal("").transform(() => null)),
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(150)
    .optional()
    .or(z.literal("").transform(() => null)),
})

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  quantityOnHand: z.coerce.number().min(0).max(1000000).optional(),
  reorderThreshold: z.coerce.number().min(0).max(1000000).optional(),
  supplierId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => null)),
})

export const stockInSchema = z.object({
  quantity: z.coerce.number().min(0.0001),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => null)),
})

export const adjustStockSchema = z.object({
  quantity: z.coerce
    .number()
    .refine((v) => v !== 0, "Quantity must not be zero"),
  note: z.string().trim().min(1).max(500),
})

export const reorderThresholdSchema = z.object({
  reorderThreshold: z.coerce.number().min(0).max(1000000),
})

export const recipeIngredientSchema = z.object({
  menuItemId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantityUsed: z.coerce.number().min(0).max(1000000),
})
