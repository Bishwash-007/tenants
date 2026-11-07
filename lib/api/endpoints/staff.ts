import "server-only"

import { apiFetch } from "@/lib/api/client"

export interface Shift {
  id: string
  tenant_id: string
  branch_id: string
  user_id: string
  start_time: string
  end_time: string
  created_at: string
}

export interface CreateShiftInput {
  userId: string
  startTime: string
  endTime: string
}

export interface UpdateShiftInput {
  startTime?: string
  endTime?: string
  userId?: string
}

export interface RosterShift {
  id: string
  userId: string
  startTime: string
  endTime: string
  scheduledHours: number
  clockIn: string | null
  clockOut: string | null
  hoursWorked: number | null
}

export interface RosterStaff {
  userId: string
  fullName: string
  role: string
  shifts: RosterShift[]
}

export interface Roster {
  branchId: string
  weekStart: string
  weekEnd: string
  staff: RosterStaff[]
}

export interface PayrollLine {
  userId: string
  fullName: string
  role: string
  payType: string
  rate: number
  hoursWorked: number
  wage: number
  openRecords: number
}

export interface Payroll {
  branchId: string
  from: string
  to: string
  lines: PayrollLine[]
  total: number
}

export interface WageRate {
  id: string
  tenant_id: string
  user_id: string
  pay_type: string
  rate: string
  created_at: string
  updated_at: string
}

export interface SetWageRateInput {
  payType: string
  rate: number
}

export function listShiftsRequest(branchId: string): Promise<Shift[]> {
  return apiFetch<Shift[]>(`/branches/${branchId}/shifts`)
}

export function getShiftRequest(id: string): Promise<Shift> {
  // id-only not supported; keep for completeness not used
  return apiFetch<Shift>(`/branches/x/shifts/${id}`)
}

export function createShiftRequest(
  branchId: string,
  input: CreateShiftInput
): Promise<Shift> {
  return apiFetch<Shift>(`/branches/${branchId}/shifts`, {
    method: "POST",
    body: input,
  })
}

export function updateShiftRequest(
  branchId: string,
  id: string,
  input: UpdateShiftInput
): Promise<Shift> {
  return apiFetch<Shift>(`/branches/${branchId}/shifts/${id}`, {
    method: "PATCH",
    body: input,
  })
}

export function deleteShiftRequest(
  branchId: string,
  id: string
): Promise<void> {
  return apiFetch<void>(`/branches/${branchId}/shifts/${id}`, {
    method: "DELETE",
  })
}

export function clockInRequest(
  branchId: string,
  shiftId?: string
): Promise<unknown> {
  return apiFetch<unknown>(`/branches/${branchId}/attendance/clock-in`, {
    method: "POST",
    body: shiftId ? { shiftId } : {},
  })
}

export function clockOutRequest(
  branchId: string,
  shiftId?: string
): Promise<unknown> {
  return apiFetch<unknown>(`/branches/${branchId}/attendance/clock-out`, {
    method: "POST",
    body: shiftId ? { shiftId } : {},
  })
}

export function getRosterRequest(
  branchId: string,
  week?: string
): Promise<Roster> {
  const query = week ? `?week=${encodeURIComponent(week)}` : ""
  return apiFetch<Roster>(`/branches/${branchId}/roster${query}`)
}

export function getPayrollRequest(
  branchId: string,
  from?: string,
  to?: string
): Promise<Payroll> {
  const params = new URLSearchParams()
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  const query = params.toString() ? `?${params.toString()}` : ""
  return apiFetch<Payroll>(`/branches/${branchId}/payroll${query}`)
}

export function setWageRateRequest(
  branchId: string,
  userId: string,
  input: SetWageRateInput
): Promise<WageRate> {
  return apiFetch<WageRate>(`/branches/${branchId}/wage-rates/${userId}`, {
    method: "PUT",
    body: input,
  })
}

export function getWageRateRequest(
  branchId: string,
  userId: string
): Promise<WageRate> {
  return apiFetch<WageRate>(`/branches/${branchId}/wage-rates/${userId}`)
}
