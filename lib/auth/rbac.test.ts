import { describe, expect, it } from "vitest"

import {
  can,
  canAccessBranch,
  isOrgWide,
  isRole,
  isStaffRole,
} from "@/lib/auth/rbac"

describe("isRole", () => {
  it("accepts API roles", () => {
    expect(isRole("org_owner")).toBe(true)
    expect(isRole("kitchen_staff")).toBe(true)
  })

  it("rejects unknown values", () => {
    expect(isRole("owner")).toBe(false)
  })
})

describe("isStaffRole", () => {
  it("keeps staff roles inside the dashboard", () => {
    expect(isStaffRole("waiter")).toBe(true)
  })

  it("rejects customers", () => {
    expect(isStaffRole("customer")).toBe(false)
  })
})

describe("can", () => {
  it("lets owners manage org-wide menu items", () => {
    expect(can("org_owner", "manageOrgMenu")).toBe(true)
  })

  it("blocks branch managers from org-wide menu writes", () => {
    expect(can("branch_manager", "manageOrgMenu")).toBe(false)
  })

  it("lets kitchen staff transition orders", () => {
    expect(can("kitchen_staff", "transitionOrder")).toBe(true)
  })

  it("blocks kitchen staff from taking orders", () => {
    expect(can("kitchen_staff", "createOrder")).toBe(false)
  })

  it("blocks waiters from refunding payments", () => {
    expect(can("waiter", "refundPayment")).toBe(false)
  })

  it("blocks branch managers from billing", () => {
    expect(can("branch_manager", "viewBilling")).toBe(false)
  })
})

describe("canAccessBranch", () => {
  it("lets org-wide users access any branch", () => {
    expect(canAccessBranch("org_owner", null, "branch-b")).toBe(true)
  })

  it("confines a branch-scoped user to their own branch", () => {
    expect(canAccessBranch("branch_manager", "branch-a", "branch-b")).toBe(
      false
    )
    expect(canAccessBranch("branch_manager", "branch-a", "branch-a")).toBe(true)
  })
})

describe("isOrgWide", () => {
  it("treats super admins and owners as org-wide", () => {
    expect(isOrgWide("super_admin")).toBe(true)
    expect(isOrgWide("org_owner")).toBe(true)
    expect(isOrgWide("branch_manager")).toBe(false)
  })
})
