/**
 * TEMPORARY DEBUG LOGGING.
 *
 * Server-side only: this output appears in the terminal running `next dev`
 * (or the server process), NOT in the browser console.
 *
 * Remove this file, the calls in `lib/api/client.ts`, and the logs in
 * `lib/api/errors.ts` / `lib/actions/state.ts` once debugging is done.
 *
 * Tokens and passwords are redacted before anything is printed.
 */

/** Flip to `false` to silence everything without deleting the calls. */
const DEBUG = true

const REDACTED = "[redacted]"

const SENSITIVE_KEYS = new Set([
  "password",
  "accesstoken",
  "refreshtoken",
  "token",
  "authorization",
  "cookie",
  "set-cookie",
  "secret",
  "apikey",
  "clientsecret",
])

function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry, seen))
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) {
      return "[circular]"
    }

    seen.add(value)

    const result: Record<string, unknown> = {}

    for (const [key, entry] of Object.entries(value)) {
      result[key] = SENSITIVE_KEYS.has(key.toLowerCase())
        ? REDACTED
        : redact(entry, seen)
    }

    return result
  }

  return value
}

interface ApiRequestLog {
  method: string
  path: string
  tenant: string | null
  hasToken: boolean
  body?: unknown
}

export function logApiRequest(input: ApiRequestLog): void {
  if (!DEBUG) return

  console.log(`[api] -> ${input.method} ${input.path}`, {
    tenant: input.tenant,
    hasToken: input.hasToken,
    ...(input.body === undefined ? {} : { body: redact(input.body) }),
  })
}

interface ApiResponseLog {
  method: string
  path: string
  status: number
  startedAt: number
  response: Response
}

export async function logApiResponse(input: ApiResponseLog): Promise<void> {
  if (!DEBUG) return

  const elapsed = Date.now() - input.startedAt
  const contentType = input.response.headers.get("content-type") ?? ""

  let body: unknown

  try {
    body = contentType.includes("application/json")
      ? await input.response.clone().json()
      : await input.response.clone().text()
  } catch {
    body = "[unreadable body]"
  }

  const line = `[api] <- ${input.status} ${input.method} ${input.path} (${elapsed}ms)`

  if (input.status >= 400) {
    console.error(line, redact(body))
    return
  }

  console.log(line, redact(body))
}

interface ApiNetworkErrorLog {
  method: string
  path: string
  error: unknown
}

export function logApiNetworkError(input: ApiNetworkErrorLog): void {
  if (!DEBUG) return

  console.error(
    `[api] !! ${input.method} ${input.path} failed before a response`,
    input.error
  )
}
