import "server-only"

import { z } from "zod"

const envSchema = z.object({
  API_BASE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000"),
  DEFAULT_TENANT_SLUG: z.string().min(2).max(50).optional(),
  DASHBOARD_ROOT_DOMAIN: z.string().min(1).default("localhost"),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().min(3).max(3).default("USD"),
  SESSION_COOKIE_SECURE: z
    .enum(["true", "false"])
    .default(process.env.NODE_ENV === "production" ? "true" : "false"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ")
  throw new Error(`Invalid environment configuration: ${details}`)
}

export const env = {
  ...parsed.data,
  SESSION_COOKIE_SECURE: parsed.data.SESSION_COOKIE_SECURE === "true",
}
