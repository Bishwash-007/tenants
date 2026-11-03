import { describe, expect, it } from "vitest"

import {
  getTenantSlugFromHost,
  isValidTenantSlug,
  normalizeHost,
} from "@/lib/auth/tenant"

describe("normalizeHost", () => {
  it("lower-cases and strips a port", () => {
    expect(normalizeHost("BeanHouse.Localhost:3001")).toBe(
      "beanhouse.localhost"
    )
  })

  it("strips a trailing dot", () => {
    expect(normalizeHost("beanhouse.example.com.")).toBe(
      "beanhouse.example.com"
    )
  })

  it("keeps IPv6 literals intact", () => {
    expect(normalizeHost("[::1]:3001")).toBe("[::1]")
  })

  it("returns an empty string for missing hosts", () => {
    expect(normalizeHost(undefined)).toBe("")
  })
})

describe("getTenantSlugFromHost", () => {
  it("extracts a tenant from localhost", () => {
    expect(getTenantSlugFromHost("beanhouse.localhost:3001", "localhost")).toBe(
      "beanhouse"
    )
  })

  it("extracts a tenant from a root domain", () => {
    expect(
      getTenantSlugFromHost(
        "beanhouse.dashboard.example.com",
        "dashboard.example.com"
      )
    ).toBe("beanhouse")
  })

  it("returns null for the apex", () => {
    expect(
      getTenantSlugFromHost("dashboard.example.com", "dashboard.example.com")
    ).toBeNull()
  })

  it("returns null for www", () => {
    expect(
      getTenantSlugFromHost(
        "www.dashboard.example.com",
        "dashboard.example.com"
      )
    ).toBeNull()
  })

  it("returns null for an IP address", () => {
    expect(getTenantSlugFromHost("127.0.0.1:3001", "localhost")).toBeNull()
  })

  it("returns null for an unrelated domain", () => {
    expect(
      getTenantSlugFromHost("beanhouse.evil.com", "dashboard.example.com")
    ).toBeNull()
  })

  it("rejects multi-label prefixes", () => {
    expect(
      getTenantSlugFromHost(
        "a.b.dashboard.example.com",
        "dashboard.example.com"
      )
    ).toBeNull()
  })
})

describe("isValidTenantSlug", () => {
  it("accepts letters, digits, dashes, and underscores", () => {
    expect(isValidTenantSlug("bean-house_2")).toBe(true)
  })

  it("rejects a leading dash", () => {
    expect(isValidTenantSlug("-beanhouse")).toBe(false)
  })

  it("rejects slugs longer than 50 characters", () => {
    expect(isValidTenantSlug("a".repeat(51))).toBe(false)
  })
})
