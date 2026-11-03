import { z } from "zod"

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9][a-z0-9_-]*$/i, "Use letters, digits, '-' or '_'")

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(72),
  tenantSlug: slugSchema.optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
