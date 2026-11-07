/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useActionState, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowsClockwiseIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"

import { SortableHeader } from "@/components/data-table/sortable-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { Shift, Roster, Payroll } from "@/lib/api/endpoints/staff"
import { toast } from "sonner"
import { IDLE_ACTION_STATE } from "@/lib/actions/state"
import { useActionToast } from "@/hooks/use-action-toast"
import { useActionSuccess } from "@/hooks/use-action-success"
import { FieldError } from "@/components/forms/action-message"
import { SubmitButton } from "@/components/forms/submit-button"
import { Label } from "@/components/ui/label"
import {
  createShiftAction,
  deleteShiftAction,
  clockInAction,
  clockOutAction,
  setWageRateAction,
} from "./actions"

interface Props {
  branchId: string
  shifts: Shift[]
  roster: Roster | null
  payroll: Payroll | null
  canManage: boolean
  canViewPayroll: boolean
}

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
})

const PAGE_SIZES = ["10", "20", "50"].map((v) => ({ value: v, label: v }))

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

export function StaffClient({
  branchId,
  shifts,
  roster,
  payroll,
  canManage,
  canViewPayroll,
}: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [refreshing, startRefresh] = useTransition()
  function refresh() {
    startRefresh(() => router.refresh())
  }

  // Shifts table
  const [shiftsSorting, setShiftsSorting] = useState<SortingState>([
    { id: "start_time", desc: false },
  ])
  const [shiftsGlobal, setShiftsGlobal] = useState("")
  const [shiftsPagination, setShiftsPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const shiftsColumnHelper = useMemo(
    () => createColumnHelper<typeof features, Shift>(),
    []
  )
  const shiftsColumns = useMemo(() => {
    const base = shiftsColumnHelper.columns([
      shiftsColumnHelper.accessor((r) => r.user_id.slice(0, 8), {
        id: "user",
        header: ({ column }) => <SortableHeader label="User" column={column} />,
      }),
      shiftsColumnHelper.accessor("start_time", {
        header: ({ column }) => (
          <SortableHeader label="Start" column={column} />
        ),
        cell: ({ row }) => new Date(row.original.start_time).toLocaleString(),
      }),
      shiftsColumnHelper.accessor("end_time", {
        header: ({ column }) => <SortableHeader label="End" column={column} />,
        cell: ({ row }) => new Date(row.original.end_time).toLocaleString(),
      }),
    ])
    if (!canManage) return base
    return [
      ...base,
      shiftsColumnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                const res = await deleteShiftAction(branchId, row.original.id)
                if (res.status === "success") {
                  toast.success(res.message ?? "Shift deleted.")
                  refresh()
                } else {
                  toast.error(res.message ?? "Failed.")
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ]
  }, [canManage, branchId])

  const shiftsTable = useTable({
    features,
    columns: shiftsColumns,
    data: shifts,
    getRowId: (r) => r.id,
    state: {
      sorting: shiftsSorting,
      globalFilter: shiftsGlobal,
      pagination: shiftsPagination,
    },
    onSortingChange: setShiftsSorting,
    onGlobalFilterChange: (u) =>
      setShiftsGlobal((p) => (typeof u === "function" ? u(p) : u)),
    onPaginationChange: setShiftsPagination,
    globalFilterFn: (row, _c, fv) => {
      const q = String(fv ?? "")
        .trim()
        .toLowerCase()
      if (!q) return true
      const s = row.original
      return [s.user_id, s.start_time, s.end_time].some((v) =>
        String(v).toLowerCase().includes(q)
      )
    },
  })

  // Roster table (flattened shifts)
  const rosterRows = useMemo(() => {
    if (!roster) return []
    return roster.staff.flatMap((st) =>
      st.shifts.map((sh) => ({
        userId: st.userId,
        fullName: st.fullName,
        role: st.role,
        shiftId: sh.id,
        startTime: sh.startTime,
        endTime: sh.endTime,
        scheduledHours: sh.scheduledHours,
        hoursWorked: sh.hoursWorked,
        clockIn: sh.clockIn,
        clockOut: sh.clockOut,
      }))
    )
  }, [roster])

  const [rosterGlobal, setRosterGlobal] = useState("")
  const [rosterPagination, setRosterPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [rosterSorting, setRosterSorting] = useState<SortingState>([
    { id: "fullName", desc: false },
  ])

  const rosterColumnHelper = useMemo(
    () => createColumnHelper<typeof features, (typeof rosterRows)[number]>(),
    []
  )
  const rosterColumns = useMemo(
    () =>
      rosterColumnHelper.columns([
        rosterColumnHelper.accessor("fullName", {
          header: ({ column }) => (
            <SortableHeader label="Name" column={column} />
          ),
        }),
        rosterColumnHelper.accessor("role", {
          header: ({ column }) => (
            <SortableHeader label="Role" column={column} />
          ),
          cell: ({ row }) => (
            <Badge variant="secondary">{row.original.role}</Badge>
          ),
        }),
        rosterColumnHelper.accessor("startTime", {
          header: ({ column }) => (
            <SortableHeader label="Start" column={column} />
          ),
          cell: ({ row }) => new Date(row.original.startTime).toLocaleString(),
        }),
        rosterColumnHelper.accessor("endTime", {
          header: ({ column }) => (
            <SortableHeader label="End" column={column} />
          ),
          cell: ({ row }) => new Date(row.original.endTime).toLocaleString(),
        }),
        rosterColumnHelper.accessor("scheduledHours", {
          header: ({ column }) => (
            <SortableHeader label="Sched hrs" column={column} />
          ),
          cell: ({ row }) => (
            <span className="tabular-nums">{row.original.scheduledHours}</span>
          ),
        }),
        rosterColumnHelper.accessor((r) => r.hoursWorked ?? 0, {
          id: "hoursWorked",
          header: ({ column }) => (
            <SortableHeader label="Worked" column={column} />
          ),
          cell: ({ row }) => (
            <span className="tabular-nums">
              {row.original.hoursWorked ?? "—"}
            </span>
          ),
        }),
      ]),
    []
  )

  const rosterTable = useTable({
    features,
    columns: rosterColumns,
    data: rosterRows,
    getRowId: (r, i) => `${r.shiftId}-${i}`,
    state: {
      sorting: rosterSorting,
      globalFilter: rosterGlobal,
      pagination: rosterPagination,
    },
    onSortingChange: setRosterSorting,
    onGlobalFilterChange: (u) =>
      setRosterGlobal((p) => (typeof u === "function" ? u(p) : u)),
    onPaginationChange: setRosterPagination,
    globalFilterFn: (row, _c, fv) => {
      const q = String(fv ?? "")
        .trim()
        .toLowerCase()
      if (!q) return true
      const r = row.original
      return [r.fullName, r.role, r.userId].some((v) =>
        String(v).toLowerCase().includes(q)
      )
    },
  })

  // Payroll table
  const payrollRows = payroll?.lines ?? []
  const [payrollGlobal, setPayrollGlobal] = useState("")
  const [payrollPagination, setPayrollPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [payrollSorting, setPayrollSorting] = useState<SortingState>([
    { id: "fullName", desc: false },
  ])

  const payrollColumnHelper = useMemo(
    () => createColumnHelper<typeof features, (typeof payrollRows)[number]>(),
    []
  )
  const payrollColumns = useMemo(
    () =>
      payrollColumnHelper.columns([
        payrollColumnHelper.accessor("fullName", {
          header: ({ column }) => (
            <SortableHeader label="Name" column={column} />
          ),
        }),
        payrollColumnHelper.accessor("role", {
          header: ({ column }) => (
            <SortableHeader label="Role" column={column} />
          ),
        }),
        payrollColumnHelper.accessor("rate", {
          header: ({ column }) => (
            <SortableHeader label="Rate" column={column} />
          ),
          cell: ({ row }) => (
            <span className="tabular-nums">{row.original.rate}</span>
          ),
        }),
        payrollColumnHelper.accessor("hoursWorked", {
          header: ({ column }) => (
            <SortableHeader label="Hours" column={column} />
          ),
          cell: ({ row }) => (
            <span className="tabular-nums">{row.original.hoursWorked}</span>
          ),
        }),
        payrollColumnHelper.accessor("wage", {
          header: ({ column }) => (
            <SortableHeader label="Wage" column={column} />
          ),
          cell: ({ row }) => (
            <span className="tabular-nums">{row.original.wage}</span>
          ),
        }),
        payrollColumnHelper.accessor("openRecords", {
          header: ({ column }) => (
            <SortableHeader label="Open" column={column} />
          ),
          cell: ({ row }) => (
            <span className="tabular-nums">{row.original.openRecords}</span>
          ),
        }),
      ]),
    []
  )

  const payrollTable = useTable({
    features,
    columns: payrollColumns,
    data: payrollRows,
    getRowId: (r, i) => `${r.userId}-${i}`,
    state: {
      sorting: payrollSorting,
      globalFilter: payrollGlobal,
      pagination: payrollPagination,
    },
    onSortingChange: setPayrollSorting,
    onGlobalFilterChange: (u) =>
      setPayrollGlobal((p) => (typeof u === "function" ? u(p) : u)),
    onPaginationChange: setPayrollPagination,
    globalFilterFn: (row, _c, fv) => {
      const q = String(fv ?? "")
        .trim()
        .toLowerCase()
      if (!q) return true
      const r = row.original
      return [r.fullName, r.role, r.userId].some((v) =>
        String(v).toLowerCase().includes(q)
      )
    },
  })

  const renderTable = (
    table: any,
    globalFilter: string,
    setGlobalFilter: (v: string) => void,
    pagination: PaginationState,
    filteredCount: number,
    firstRow: number,
    lastRow: number,
    emptyText: string,
    rows: any[]
  ) => (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={globalFilter}
            aria-label="Search"
            placeholder="Search…"
            className="pl-8"
            onChange={(e) => {
              table.setGlobalFilter(e.target.value)
              table.setPageIndex(0)
            }}
          />
        </div>
        <Button variant="outline" onClick={refresh} disabled={refreshing}>
          <ArrowsClockwiseIcon
            data-icon="inline-start"
            className={refreshing ? "animate-spin" : undefined}
          />
          Refresh
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg: any) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h: any) => (
                  <TableHead
                    key={h.id}
                    className={h.id === "actions" ? "w-32" : undefined}
                  >
                    {h.isPlaceholder ? null : <table.FlexRender header={h} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {rows.length === 0
                    ? emptyText
                    : "No results match your search."}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row: any) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell: any) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "actions" ? "text-right" : undefined
                      }
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {filteredCount === 0
            ? "No rows"
            : `Showing ${firstRow}–${lastRow} of ${filteredCount}`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
            items={PAGE_SIZES}
          >
            <SelectTrigger size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  )

  const shiftsFilteredCount = shiftsTable.getFilteredRowModel().rows.length
  const shiftsFirst =
    shiftsFilteredCount === 0
      ? 0
      : shiftsPagination.pageIndex * shiftsPagination.pageSize + 1
  const shiftsLast = Math.min(
    (shiftsPagination.pageIndex + 1) * shiftsPagination.pageSize,
    shiftsFilteredCount
  )

  const rosterFilteredCount = rosterTable.getFilteredRowModel().rows.length
  const rosterFirst =
    rosterFilteredCount === 0
      ? 0
      : rosterPagination.pageIndex * rosterPagination.pageSize + 1
  const rosterLast = Math.min(
    (rosterPagination.pageIndex + 1) * rosterPagination.pageSize,
    rosterFilteredCount
  )

  const payrollFilteredCount = payrollTable.getFilteredRowModel().rows.length
  const payrollFirst =
    payrollFilteredCount === 0
      ? 0
      : payrollPagination.pageIndex * payrollPagination.pageSize + 1
  const payrollLast = Math.min(
    (payrollPagination.pageIndex + 1) * payrollPagination.pageSize,
    payrollFilteredCount
  )

  return (
    <div className="space-y-4">
      <Tabs defaultValue="shifts">
        <TabsList>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          {canViewPayroll ? (
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
          ) : null}
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          {canManage ? (
            <TabsTrigger value="wages">Wage rates</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="shifts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Shifts</h2>
            {canManage ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                Add shift
              </Button>
            ) : null}
          </div>
          {shifts.length === 0 ? (
            <Empty text="No shifts scheduled." />
          ) : (
            renderTable(
              shiftsTable,
              shiftsGlobal,
              setShiftsGlobal,
              shiftsPagination,
              shiftsFilteredCount,
              shiftsFirst,
              shiftsLast,
              "No shifts scheduled.",
              shifts
            )
          )}
        </TabsContent>

        <TabsContent value="roster" className="space-y-4">
          <h2 className="text-sm font-semibold">Roster (this week)</h2>
          {rosterRows.length === 0 ? (
            <Empty text="No roster data." />
          ) : (
            renderTable(
              rosterTable,
              rosterGlobal,
              setRosterGlobal,
              rosterPagination,
              rosterFilteredCount,
              rosterFirst,
              rosterLast,
              "No roster data.",
              rosterRows
            )
          )}
        </TabsContent>

        {canViewPayroll ? (
          <TabsContent value="payroll" className="space-y-4">
            <h2 className="text-sm font-semibold">Payroll</h2>
            {payrollRows.length === 0 ? (
              <Empty text="No payroll data." />
            ) : (
              <>
                {renderTable(
                  payrollTable,
                  payrollGlobal,
                  setPayrollGlobal,
                  payrollPagination,
                  payrollFilteredCount,
                  payrollFirst,
                  payrollLast,
                  "No payroll data.",
                  payrollRows
                )}
                <div className="text-right text-sm font-semibold">
                  Total: {payroll?.total}
                </div>
              </>
            )}
          </TabsContent>
        ) : null}

        <TabsContent value="attendance" className="space-y-3">
          <h2 className="text-sm font-semibold">Clock in / out</h2>
          <p className="text-sm text-muted-foreground">
            Uses the signed-in user&apos;s token.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                const res = await clockInAction(branchId)
                if (res.status === "success") {
                  toast.success(res.message ?? "Clocked in.")
                } else {
                  toast.error(res.message ?? "Failed.")
                }
              }}
            >
              Clock in
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const res = await clockOutAction(branchId)
                if (res.status === "success") {
                  toast.success(res.message ?? "Clocked out.")
                } else {
                  toast.error(res.message ?? "Failed.")
                }
              }}
            >
              Clock out
            </Button>
          </div>
        </TabsContent>

        {canManage ? (
          <TabsContent value="wages" className="space-y-3">
            <h2 className="text-sm font-semibold">Set wage rate</h2>
            <WageRateForm branchId={branchId} />
          </TabsContent>
        ) : null}
      </Tabs>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add shift</SheetTitle>
            <SheetDescription>Schedule a staff member.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <CreateShiftForm
              branchId={branchId}
              onDone={() => setCreateOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function CreateShiftForm({
  branchId,
  onDone,
}: {
  branchId: string
  onDone: () => void
}) {
  const [state, formAction] = useActionState(
    createShiftAction,
    IDLE_ACTION_STATE
  )
  const formRef = useRef<HTMLFormElement>(null)
  useActionToast(state)
  useActionSuccess(state, onDone)
  useActionSuccess(state, () => formRef.current?.reset())
  const errors = state.fieldErrors ?? {}
  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="branchId" value={branchId} />
      <div className="space-y-1.5">
        <Label>User ID</Label>
        <Input name="userId" aria-invalid={Boolean(errors.userId)} />
        <FieldError message={errors.userId} />
      </div>
      <div className="space-y-1.5">
        <Label>Start time (ISO)</Label>
        <Input
          name="startTime"
          placeholder="2026-11-10T08:00:00+05:45"
          aria-invalid={Boolean(errors.startTime)}
        />
        <FieldError message={errors.startTime} />
      </div>
      <div className="space-y-1.5">
        <Label>End time (ISO)</Label>
        <Input
          name="endTime"
          placeholder="2026-11-10T16:00:00+05:45"
          aria-invalid={Boolean(errors.endTime)}
        />
        <FieldError message={errors.endTime} />
      </div>
      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save
      </SubmitButton>
    </form>
  )
}

function WageRateForm({ branchId }: { branchId: string }) {
  const [state, formAction] = useActionState(
    setWageRateAction,
    IDLE_ACTION_STATE
  )
  const formRef = useRef<HTMLFormElement>(null)
  useActionToast(state)
  useActionSuccess(state, () => formRef.current?.reset())
  const errors = state.fieldErrors ?? {}
  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="branchId" value={branchId} />
      <div className="space-y-1.5">
        <Label>User ID</Label>
        <Input name="userId" aria-invalid={Boolean(errors.userId)} />
        <FieldError message={errors.userId} />
      </div>
      <div className="space-y-1.5">
        <Label>Pay type</Label>
        <Input
          name="payType"
          defaultValue="hourly"
          aria-invalid={Boolean(errors.payType)}
        />
        <FieldError message={errors.payType} />
      </div>
      <div className="space-y-1.5">
        <Label>Rate</Label>
        <Input
          name="rate"
          type="number"
          step="any"
          aria-invalid={Boolean(errors.rate)}
        />
        <FieldError message={errors.rate} />
      </div>
      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save
      </SubmitButton>
    </form>
  )
}
