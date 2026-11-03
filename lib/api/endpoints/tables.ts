import "server-only"

import { apiFetch } from "@/lib/api/client"
import type { Table } from "@/lib/api/types"

export function listTablesRequest(branchId: string): Promise<Table[]> {
  return apiFetch<Table[]>(`/branches/${branchId}/tables`)
}

export function createTableRequest(
  branchId: string,
  input: { label: string; seats?: number }
): Promise<Table> {
  return apiFetch<Table>(`/branches/${branchId}/tables`, {
    method: "POST",
    body: input,
  })
}
