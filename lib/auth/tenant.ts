const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{1,49}$/i

/**
 * Normalize a Host header value: lower-case, strip the port, strip a trailing
 * dot. IPv6 literals are kept intact.
 */
export function normalizeHost(host: string | null | undefined): string {
  if (!host) {
    return ""
  }

  let value = host.trim().toLowerCase()

  if (value.startsWith("[")) {
    const closingBracket = value.indexOf("]")
    return closingBracket === -1 ? value : value.slice(0, closingBracket + 1)
  }

  const portSeparator = value.indexOf(":")
  if (portSeparator !== -1) {
    value = value.slice(0, portSeparator)
  }

  return value.replace(/\.$/, "")
}

export function isValidTenantSlug(value: string): boolean {
  return SLUG_PATTERN.test(value)
}

/**
 * Extract a tenant slug from a subdomain.
 *
 * `beanhouse.localhost` with root `localhost` -> `beanhouse`
 * `beanhouse.dashboard.example.com` with root `dashboard.example.com` -> `beanhouse`
 *
 * Returns null for the apex, `www`, IP addresses, unknown domains, and
 * multi-label prefixes.
 */
export function getTenantSlugFromHost(
  host: string | null | undefined,
  rootDomain: string
): string | null {
  const normalizedHost = normalizeHost(host)
  const normalizedRoot = normalizeHost(rootDomain)

  if (!normalizedHost || !normalizedRoot) {
    return null
  }

  if (normalizedHost === normalizedRoot) {
    return null
  }

  if (normalizedHost.startsWith("[")) {
    return null
  }

  const suffix = `.${normalizedRoot}`
  if (!normalizedHost.endsWith(suffix)) {
    return null
  }

  const prefix = normalizedHost.slice(0, -suffix.length)

  if (!prefix || prefix === "www" || prefix.includes(".")) {
    return null
  }

  return isValidTenantSlug(prefix) ? prefix : null
}
