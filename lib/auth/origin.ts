/**
 * Reject cross-site browser requests to state-changing route handlers.
 * Server-to-server calls without an Origin header are allowed.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")

  if (!origin) {
    return true
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")

  if (!host) {
    return false
  }

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}
