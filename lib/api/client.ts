import "server-only"

import { getAccessToken } from "@/lib/auth/cookies"
import { getTenantSlug } from "@/lib/auth/request-context"
import {
  logApiNetworkError,
  logApiRequest,
  logApiResponse,
} from "@/lib/api/debug-log"
import { ApiError, parseApiError } from "@/lib/api/errors"
import { env } from "@/lib/env"

type JsonBody = object

export interface ApiRequestOptions extends Omit<
  RequestInit,
  "body" | "headers"
> {
  body?: BodyInit | JsonBody | null
  token?: string | null
  tenant?: string | null
  headers?: HeadersInit
}

function isNativeBody(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  )
}

export async function apiRequest(
  path: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const tenant =
    options.tenant === undefined ? await getTenantSlug() : options.tenant

  if (!tenant) {
    throw new ApiError(400, "A workspace is required for this request")
  }

  const token =
    options.token === undefined ? await getAccessToken() : options.token

  const requestHeaders = new Headers(options.headers)
  requestHeaders.set("X-Tenant-Id", tenant)

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  const method = (options.method ?? "GET").toUpperCase()
  const debugBody = isNativeBody(options.body) ? undefined : options.body

  logApiRequest({
    method,
    path,
    tenant: tenant ?? null,
    hasToken: Boolean(token),
    body: debugBody ?? undefined,
  })

  let body = options.body
  if (body !== undefined && body !== null && !isNativeBody(body)) {
    requestHeaders.set("Content-Type", "application/json")
    body = JSON.stringify(body)
  }

  const {
    token: _token,
    tenant: _tenant,
    body: _body,
    headers: _headers,
    cache,
    ...fetchOptions
  } = options

  void _token
  void _tenant
  void _body
  void _headers

  let response: Response
  const startedAt = Date.now()

  try {
    response = await fetch(new URL(path, env.API_BASE_URL), {
      ...fetchOptions,
      headers: requestHeaders,
      body: body as BodyInit | null | undefined,
      cache: cache ?? "no-store",
    })
  } catch (error) {
    logApiNetworkError({ method, path, error })

    throw new ApiError(
      0,
      error instanceof Error
        ? `Cannot reach the API: ${error.message}`
        : "Cannot reach the API"
    )
  }

  await logApiResponse({
    method,
    path,
    status: response.status,
    startedAt,
    response,
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  return response
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await apiRequest(path, options)

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return (await response.json()) as T
  }

  return (await response.text()) as T
}
