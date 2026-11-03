export const ROLES = [
  "super_admin",
  "org_owner",
  "branch_manager",
  "receptionist",
  "waiter",
  "kitchen_staff",
  "customer",
] as const

export type Role = (typeof ROLES)[number]

export type Capability =
  | "viewBranches"
  | "manageBranches"
  | "viewMenu"
  | "manageBranchMenu"
  | "manageOrgMenu"
  | "viewOrders"
  | "createOrder"
  | "transitionOrder"
  | "checkoutOrder"
  | "refundPayment"
  | "managePaymentConfig"
  | "viewInventory"
  | "manageInventory"
  | "viewStaff"
  | "manageStaff"
  | "clockAttendance"
  | "viewCrm"
  | "manageCrm"
  | "managePromotions"
  | "announcePromotions"
  | "viewReports"
  | "viewBilling"
  | "viewNotifications"

const ALL_STAFF: Role[] = [
  "super_admin",
  "org_owner",
  "branch_manager",
  "receptionist",
  "waiter",
  "kitchen_staff",
]

const CAPABILITIES: Record<Capability, Role[]> = {
  viewBranches: ALL_STAFF,
  manageBranches: ["super_admin", "org_owner", "branch_manager"],
  viewMenu: ALL_STAFF,
  manageBranchMenu: ["super_admin", "org_owner", "branch_manager"],
  manageOrgMenu: ["super_admin", "org_owner"],
  viewOrders: ALL_STAFF,
  createOrder: [
    "super_admin",
    "org_owner",
    "branch_manager",
    "receptionist",
    "waiter",
  ],
  transitionOrder: [
    "super_admin",
    "org_owner",
    "branch_manager",
    "receptionist",
    "waiter",
    "kitchen_staff",
  ],
  checkoutOrder: [
    "super_admin",
    "org_owner",
    "branch_manager",
    "receptionist",
    "waiter",
  ],
  refundPayment: ["super_admin", "org_owner", "branch_manager"],
  managePaymentConfig: ["super_admin", "org_owner"],
  viewInventory: [
    "super_admin",
    "org_owner",
    "branch_manager",
    "receptionist",
    "kitchen_staff",
  ],
  manageInventory: ["super_admin", "org_owner", "branch_manager"],
  viewStaff: ["super_admin", "org_owner", "branch_manager", "receptionist"],
  manageStaff: ["super_admin", "org_owner", "branch_manager"],
  clockAttendance: ALL_STAFF,
  viewCrm: [
    "super_admin",
    "org_owner",
    "branch_manager",
    "receptionist",
    "waiter",
  ],
  manageCrm: [
    "super_admin",
    "org_owner",
    "branch_manager",
    "receptionist",
    "waiter",
  ],
  managePromotions: ["super_admin", "org_owner", "branch_manager"],
  announcePromotions: ["super_admin", "org_owner"],
  viewReports: ["super_admin", "org_owner", "branch_manager"],
  viewBilling: ["super_admin", "org_owner"],
  viewNotifications: ["super_admin", "org_owner", "branch_manager"],
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value)
}

export function isStaffRole(role: Role): boolean {
  return role !== "customer"
}

export function hasRole(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role)
}

export function can(role: Role, capability: Capability): boolean {
  return CAPABILITIES[capability].includes(role)
}

export function isOrgWide(role: Role): boolean {
  return role === "super_admin" || role === "org_owner"
}

export function canAccessBranch(
  role: Role,
  userBranchId: string | null,
  branchId: string
): boolean {
  if (isOrgWide(role) || !userBranchId) {
    return true
  }

  return userBranchId === branchId
}
