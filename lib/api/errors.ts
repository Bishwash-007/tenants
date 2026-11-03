import type { ApiErrorBody } from "@/lib/api/types"

export class ApiError extends Error {
  readonly status: number
  readonly messages: string[]
  readonly error?: string
  readonly retryAfter?: number

  constructor(
    status: number,
    message: string | string[],
    options: { error?: string; retryAfter?: number } = {}
  ) {
    const messages = Array.isArray(message) ? message : [message]

    super(messages[0] ?? "Request failed")
    this.name = "ApiError"
    this.status = status
    this.messages = messages
    this.error = options.error
    this.retryAfter = options.retryAfter
  }

  get messageText(): string {
    return this.messages.join(". ")
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isUnauthorized(error: unknown): boolean {
  return isApiError(error) && error.status === 401
}

export function isForbidden(error: unknown): boolean {
  return isApiError(error) && error.status === 403
}

export function isSubscriptionBlocked(error: unknown): boolean {
  return isApiError(error) && error.status === 402
}

export function isRateLimited(error: unknown): boolean {
  return isApiError(error) && error.status === 429
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.messageText
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong. Please try again."
}

export async function parseApiError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null

  try {
    body = (await response.json()) as ApiErrorBody
  } catch {
    // The API returned a non-JSON error (proxy, gateway, HTML page).
  }

  const message =
    body?.message ??
    (response.statusText || `Request failed with status ${response.status}`)

  const retryAfterHeader = response.headers.get("retry-after")
  const retryAfter = retryAfterHeader
    ? Number.parseInt(retryAfterHeader, 10)
    : undefined

  return new ApiError(response.status, message, {
    error: body?.error,
    retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
  })
}
