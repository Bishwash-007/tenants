import "server-only"

import { apiFetch } from "@/lib/api/client"

export interface Customer {
  id: string
  tenant_id: string
  full_name: string
  phone: string
  email: string | null
  date_of_birth: string | null
  created_at: string
}

export interface CreateCustomerInput {
  phone: string
  fullName?: string
  email?: string | null
  dateOfBirth?: string | null
}

export interface UpdateCustomerInput {
  dateOfBirth?: string | null
}

export interface LoyaltyAccount {
  id: string
  tenant_id: string
  customer_id: string
  points_balance: number
  tier: string
  updated_at: string
}

export function listCustomersRequest(phone?: string): Promise<Customer[]> {
  const query = phone ? `?phone=${encodeURIComponent(phone)}` : ""
  return apiFetch<Customer[]>(`/customers${query}`)
}

export function getCustomerRequest(id: string): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${id}`)
}

export function createCustomerRequest(
  input: CreateCustomerInput
): Promise<Customer> {
  return apiFetch<{ customer: Customer; loyalty: unknown; created: boolean }>(
    "/customers",
    { method: "POST", body: input }
  ).then((result) => result.customer)
}

export function updateCustomerRequest(
  id: string,
  input: UpdateCustomerInput
): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${id}`, {
    method: "PATCH",
    body: input,
  })
}

export function getLoyaltyRequest(customerId: string): Promise<LoyaltyAccount> {
  return apiFetch<LoyaltyAccount>(`/customers/${customerId}/loyalty`)
}

export function announceBirthdaysRequest(
  date?: string
): Promise<{ date: string; published: number }> {
  return apiFetch<{ date: string; published: number }>(
    "/customers/birthdays/announce",
    { method: "POST", body: date ? { date } : {} }
  )
}
