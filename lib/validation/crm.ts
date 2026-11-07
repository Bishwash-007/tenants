import { z } from "zod"

export const customerSchema = z.object({
  phone: z.string().trim().min(1, "Phone is required").max(40),
  fullName: z
    .string()
    .trim()
    .max(150)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(150)
    .optional()
    .or(z.literal("").transform(() => null)),
  dateOfBirth: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^\\d{4}-\\d{2}-\\d{2}$/.test(v),
      "Use YYYY-MM-DD"
    )
    .transform((v) => (v === "" ? null : v))
    .nullable(),
})

export const customerUpdateSchema = z.object({
  dateOfBirth: z.string().trim().optional().nullable(),
})

export const promotionSchema = z.object({
  code: z.string().trim().min(1).max(60),
  description: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => null)),
  discountType: z.enum(["percentage", "flat"]),
  discountValue: z.coerce.number().min(0),
  startsAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => null)),
  endsAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => null)),
  isActive: z.coerce.boolean().optional(),
})

export const promotionUpdateSchema = promotionSchema.partial()

export const applyPromotionSchema = z.object({
  code: z.string().trim().min(1),
  subtotal: z.coerce.number().min(0),
})
