import { z } from "zod"

/** Trim text, turning an empty string into `null` for nullable API fields. */
export function optionalText(max: number) {
  return z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional()
  )
}

export const createBranchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Branch name is required")
    .max(150, "Use 150 characters or fewer"),
  address: optionalText(1000),
  phone: optionalText(30),
})

export const updateBranchSchema = createBranchSchema.extend({
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .max(50, "Use 50 characters or fewer"),
})

export type CreateBranchValues = z.infer<typeof createBranchSchema>
export type UpdateBranchValues = z.infer<typeof updateBranchSchema>
