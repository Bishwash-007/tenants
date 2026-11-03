import type { Branch, TableStatus } from "@/lib/api/types"

/** Older API rows used `isActive`; current rows use `is_active`. */
export function isBranchActive(branch: Branch): boolean {
  return (branch.is_active ?? branch.isActive) !== false
}

const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  free: "Free",
  occupied: "Occupied",
  reserved: "Reserved",
}

export function tableStatusLabel(status: TableStatus): string {
  return TABLE_STATUS_LABELS[status] ?? status
}
