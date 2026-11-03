// Client-safe environment variables (no server-only)
export const env = {
  NEXT_PUBLIC_API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_DEFAULT_CURRENCY:
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "USD",
}
