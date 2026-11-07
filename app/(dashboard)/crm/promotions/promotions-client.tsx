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
import { toast } from "sonner"
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

import type { Promotion } from "@/lib/api/endpoints/promotions"
import { IDLE_ACTION_STATE } from "@/lib/actions/state"
import { useActionToast } from "@/hooks/use-action-toast"
import { useActionSuccess } from "@/hooks/use-action-success"
import { FieldError } from "@/components/forms/action-message"
import { SubmitButton } from "@/components/forms/submit-button"
import { Label } from "@/components/ui/label"
import { createPromotionAction, announcePromotionAction } from "../actions"

interface Props {
  promotions: Promotion[]
  canManage: boolean
  canAnnounce: boolean
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

export function PromotionsClient({
  promotions,
  canManage,
  canAnnounce,
}: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [refreshing, startRefresh] = useTransition()
  function refresh() {
    startRefresh(() => router.refresh())
  }

  const [sorting, setSorting] = useState<SortingState>([
    { id: "code", desc: false },
  ])
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const columnHelper = useMemo(
    () => createColumnHelper<typeof features, Promotion>(),
    []
  )
  const columns = useMemo(() => {
    const base = columnHelper.columns([
      columnHelper.accessor("code", {
        header: ({ column }) => <SortableHeader label="Code" column={column} />,
      }),
      columnHelper.accessor("discount_type", {
        header: ({ column }) => <SortableHeader label="Type" column={column} />,
      }),
      columnHelper.accessor((r) => Number(r.discount_value), {
        id: "value",
        header: ({ column }) => (
          <SortableHeader label="Value" column={column} />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.discount_value}</span>
        ),
      }),
      columnHelper.accessor((r) => (r.is_active ? "active" : "inactive"), {
        id: "active",
        header: ({ column }) => (
          <SortableHeader label="Active" column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? "default" : "secondary"}>
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      }),
      columnHelper.accessor((r) => r.ends_at ?? "", {
        id: "ends",
        header: ({ column }) => <SortableHeader label="Ends" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.ends_at
              ? new Date(row.original.ends_at).toLocaleDateString()
              : "—"}
          </span>
        ),
      }),
    ])
    if (!canAnnounce) return base
    return [
      ...base,
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const fd = new FormData()
                fd.set("id", row.original.id)
                const res = await announcePromotionAction(IDLE_ACTION_STATE, fd)
                if (res.status === "success")
                  toast.success(res.message ?? "Announced.")
                else toast.error(res.message ?? "Failed.")
              }}
            >
              Announce
            </Button>
          </div>
        ),
      }),
    ]
  }, [canAnnounce])

  const table = useTable({
    features,
    columns,
    data: promotions,
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
      const p = row.original
      return [p.code, p.description ?? "", p.discount_type].some((v) =>
        v.toLowerCase().includes(q)
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
            aria-label="Search promotions"
            placeholder="Search promotions…"
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
            Add promotion
          </Button>
        ) : null}
      </div>

      {promotions.length === 0 ? (
        <Empty text="No promotions." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-background">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="hover:bg-transparent">
                    {hg.headers.map((h) => (
                      <TableHead
                        key={h.id}
                        className={h.id === "actions" ? "w-32" : undefined}
                      >
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
                        <TableCell
                          key={cell.id}
                          className={
                            cell.column.id === "actions"
                              ? "text-right"
                              : undefined
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
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add promotion</SheetTitle>
            <SheetDescription />
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <CreatePromotionForm onDone={() => setCreateOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function CreatePromotionForm({ onDone }: { onDone: () => void }) {
  const [state, formAction] = useActionState(
    createPromotionAction,
    IDLE_ACTION_STATE
  )
  const formRef = useRef<HTMLFormElement>(null)
  useActionToast(state)
  useActionSuccess(state, onDone)
  useActionSuccess(state, () => formRef.current?.reset())
  const errors = state.fieldErrors ?? {}
  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Code</Label>
        <Input name="code" aria-invalid={Boolean(errors.code)} />
        <FieldError message={errors.code} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input name="description" aria-invalid={Boolean(errors.description)} />
        <FieldError message={errors.description} />
      </div>
      <div className="space-y-1.5">
        <Label>Discount type</Label>
        <select
          name="discountType"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          aria-invalid={Boolean(errors.discountType)}
        >
          <option value="percentage">percentage</option>
          <option value="flat">flat</option>
        </select>
        <FieldError message={errors.discountType} />
      </div>
      <div className="space-y-1.5">
        <Label>Discount value</Label>
        <Input
          name="discountValue"
          type="number"
          step="any"
          aria-invalid={Boolean(errors.discountValue)}
        />
        <FieldError message={errors.discountValue} />
      </div>
      <div className="space-y-1.5">
        <Label>Starts at (ISO)</Label>
        <Input name="startsAt" aria-invalid={Boolean(errors.startsAt)} />
        <FieldError message={errors.startsAt} />
      </div>
      <div className="space-y-1.5">
        <Label>Ends at (ISO)</Label>
        <Input name="endsAt" aria-invalid={Boolean(errors.endsAt)} />
        <FieldError message={errors.endsAt} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="isActive" defaultChecked />
        <Label>Active</Label>
      </div>
      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save
      </SubmitButton>
    </form>
  )
}
