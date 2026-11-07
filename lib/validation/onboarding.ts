import { z } from "zod"

export const onboardingSchema = z.object({
  orgName: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, digits, - or _"),
  firstBranchName: z.string().trim().min(1).max(120),
  firstBranchAddress: z.string().trim().max(255).optional().or(z.literal("")),
  defaultTables: z.coerce.number().int().min(0).max(50).optional(),
  ownerEmail: z.string().trim().email().max(150),
  ownerPassword: z.string().min(8).max(72),
  planId: z.string().trim().optional().or(z.literal("")),
})

export type OnboardingValues = z.infer<typeof onboardingSchema>
