"use client"

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
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

import type { Customer } from "@/lib/api/endpoints/customers"
import { IDLE_ACTION_STATE } from "@/lib/actions/state"
import { FieldError } from "@/components/forms/action-message"
import { useActionToast } from "@/hooks/use-action-toast"
import { useActionSuccess } from "@/hooks/use-action-success"
import { SubmitButton } from "@/components/forms/submit-button"
import { Label } from "@/components/ui/label"
import { createCustomerAction } from "../actions"

interface Props {
  customers: Customer[]
  canManage: boolean
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

export function CustomersClient({ customers, canManage }: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [refreshing, startRefresh] = useTransition()
  function refresh() {
    startRefresh(() => router.refresh())
  }

  const [sorting, setSorting] = useState<SortingState>([
    { id: "full_name", desc: false },
  ])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const columnHelper = useMemo(
    () => createColumnHelper<typeof features, Customer>(),
    []
  )
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("full_name", {
          header: ({ column }) => (
            <SortableHeader label="Name" column={column} />
          ),
        }),
        columnHelper.accessor("phone", {
          header: ({ column }) => (
            <SortableHeader label="Phone" column={column} />
          ),
        }),
        columnHelper.accessor((r) => r.email ?? "", {
          id: "email",
          header: ({ column }) => (
            <SortableHeader label="Email" column={column} />
          ),
        }),
        columnHelper.accessor((r) => r.date_of_birth ?? "", {
          id: "birthday",
          header: ({ column }) => (
            <SortableHeader label="Birthday" column={column} />
          ),
        }),
      ]),
    []
  )

  const table = useTable({
    features,
    columns,
    data: customers,
    getRowId: (r) => r.id,
    state: { sorting, globalFilter: search, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: (u) =>
      setSearch((p) => (typeof u === "function" ? u(p) : u)),
    onPaginationChange: setPagination,
    globalFilterFn: (row, _c, fv) => {
      const q = String(fv ?? "")
        .trim()
        .toLowerCase()
      if (!q) return true
      const c = row.original
      return [c.full_name, c.phone, c.email ?? "", c.date_of_birth ?? ""].some(
        (v) => v.toLowerCase().includes(q)
      )
    },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const firstRow =
    filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const lastRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    filteredCount
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            aria-label="Search customers"
            placeholder="Search customers…"
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
        {canManage ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            Add customer
          </Button>
        ) : null}
      </div>

      {customers.length === 0 ? (
        <Empty text="No customers." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-background">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="hover:bg-transparent">
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : (
                          <table.FlexRender header={h} />
                        )}
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
                      No results match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getAllCells().map((cell) => (
                        <TableCell key={cell.id}>
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
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add customer</SheetTitle>
            <SheetDescription>Find or create by phone.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <CreateCustomerForm onDone={() => setCreateOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function CreateCustomerForm({ onDone }: { onDone: () => void }) {
  const [state, formAction] = useActionState(
    createCustomerAction,
    IDLE_ACTION_STATE
  )
  const formRef = useRef<HTMLFormElement>(null)
  const valuesRef = useRef<Record<string, string>>({})
  useActionToast(state)
  useActionSuccess(state, onDone)
  useEffect(() => {
    if (state.status !== "error" || !formRef.current) return
    const snap = valuesRef.current
    Object.entries(snap).forEach(([name, value]) => {
      const el = formRef.current?.querySelector<HTMLInputElement>(
        `[name="${name}"]`
      )
      if (el) el.value = value
    })
  }, [state])
  const errors = state.fieldErrors ?? {}
  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4"
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget)
        const snap: Record<string, string> = {}
        fd.forEach((value, key) => {
          snap[key] = String(value)
        })
        valuesRef.current = snap
      }}
    >
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input name="phone" aria-invalid={Boolean(errors.phone)} />
        <FieldError message={errors.phone} />
      </div>
      <div className="space-y-1.5">
        <Label>Full name</Label>
        <Input name="fullName" aria-invalid={Boolean(errors.fullName)} />
        <FieldError message={errors.fullName} />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input name="email" type="email" aria-invalid={Boolean(errors.email)} />
        <FieldError message={errors.email} />
      </div>
      <div className="space-y-1.5">
        <Label>Date of birth (YYYY-MM-DD)</Label>
        <Input name="dateOfBirth" aria-invalid={Boolean(errors.dateOfBirth)} />
        <FieldError message={errors.dateOfBirth} />
      </div>
      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save
      </SubmitButton>
    </form>
  )
}
