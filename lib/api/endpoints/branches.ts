import "server-only"

import { apiFetch } from "@/lib/api/client"
import type { Branch } from "@/lib/api/types"

export interface CreateBranchInput {
  name: string
  address?: string | null
  phone?: string | null
}

export interface UpdateBranchInput extends Partial<CreateBranchInput> {
  timezone?: string
}

export function listBranchesRequest(): Promise<Branch[]> {
  return apiFetch<Branch[]>("/branches")
}

export function createBranchRequest(input: CreateBranchInput): Promise<Branch> {
  return apiFetch<Branch>("/branches", {
    method: "POST",
    body: input,
  })
}

export function updateBranchRequest(
  branchId: string,
  input: UpdateBranchInput
): Promise<Branch> {
  return apiFetch<Branch>(`/branches/${branchId}`, {
    method: "PATCH",
    body: input,
  })
}

export function deactivateBranchRequest(branchId: string): Promise<Branch> {
  return apiFetch<Branch>(`/branches/${branchId}`, {
    method: "DELETE",
  })
}

export function activateBranchRequest(branchId: string): Promise<Branch> {
  return apiFetch<Branch>(`/branches/${branchId}/activate`, {
    method: "POST",
  })
}
