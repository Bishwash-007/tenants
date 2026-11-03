"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowsClockwiseIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react"
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
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
import { isBranchActive } from "@/lib/api/normalizers"
import type { Branch } from "@/lib/api/types"

import { AddBranchSheet } from "./add-branch-sheet"
import { DeactivateBranchButton } from "./deactivate-branch-button"
import { EditBranchSheet } from "./edit-branch-sheet"
import { ReactivateBranchButton } from "./reactivate-branch-button"

interface BranchRow extends Branch {
  active: boolean
}

interface BranchesTableProps {
  branches: Branch[]
  canManage: boolean
}

const branchFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { equalsString: filterFn_equalsString },
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
})

const columnHelper = createColumnHelper<typeof branchFeatures, BranchRow>()

const PAGE_SIZE_ITEMS = ["10", "20", "50"].map((value) => ({
  value,
  label: value,
}))

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

export function BranchesTable({ branches, canManage }: BranchesTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [refreshing, startRefresh] = useTransition()

  const rows = useMemo<BranchRow[]>(
    () =>
      branches.map((branch) => ({
        ...branch,
        active: isBranchActive(branch),
      })),
    [branches]
  )

  const columns = useMemo(() => {
    const baseColumns = columnHelper.columns([
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <SortableHeader label="Branch" column={column} />
        ),
        sortFn: "alphanumeric",
        cell: ({ row }) => (
          <Link
            href={`/b/${row.original.id}/overview`}
            className="font-medium hover:underline hover:underline-offset-4"
          >
            {row.original.name}
          </Link>
        ),
      }),
      columnHelper.accessor((row) => row.address ?? "", {
        id: "address",
        header: ({ column }) => (
          <SortableHeader label="Address" column={column} />
        ),
        sortFn: "alphanumeric",
        cell: ({ row }) =>
          row.original.address ? (
            <span
              className="block max-w-56 truncate text-muted-foreground"
              title={row.original.address}
            >
              {row.original.address}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      }),
      columnHelper.accessor((row) => row.phone ?? "", {
        id: "phone",
        header: ({ column }) => (
          <SortableHeader label="Phone" column={column} />
        ),
        sortFn: "alphanumeric",
        cell: ({ row }) =>
          row.original.phone ? (
            <span className="text-muted-foreground">{row.original.phone}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      }),
      columnHelper.accessor((row) => row.timezone ?? "", {
        id: "timezone",
        header: ({ column }) => (
          <SortableHeader label="Timezone" column={column} />
        ),
        sortFn: "alphanumeric",
        cell: ({ row }) =>
          row.original.timezone ? (
            <span className="text-muted-foreground">
              {row.original.timezone}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      }),
      columnHelper.accessor((row) => (row.active ? "active" : "inactive"), {
        id: "status",
        header: ({ column }) => (
          <SortableHeader label="Status" column={column} />
        ),
        sortFn: "basic",
        filterFn: "equalsString",
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <Badge variant={row.original.active ? "secondary" : "outline"}>
            {row.original.active ? "Active" : "Inactive"}
          </Badge>
        ),
      }),
    ])

    if (!canManage) {
      return baseColumns
    }

    return [
      ...baseColumns,
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${row.original.name}`}
              onClick={() => setEditingId(row.original.id)}
            >
              <PencilSimpleIcon />
            </Button>
            {row.original.active ? (
              <DeactivateBranchButton
                branchId={row.original.id}
                branchName={row.original.name}
              />
            ) : (
              <ReactivateBranchButton
                branchId={row.original.id}
                branchName={row.original.name}
              />
            )}
          </div>
        ),
      }),
    ]
  }, [canManage])

  const table = useTable({
    features: branchFeatures,
    columns,
    data: rows,
    getRowId: (row) => row.id,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: (updater) =>
      setGlobalFilter((previous) =>
        typeof updater === "function" ? updater(previous) : updater
      ),
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "")
        .trim()
        .toLowerCase()

      if (!query) {
        return true
      }

      const branch = row.original

      return [
        branch.name,
        branch.address ?? "",
        branch.phone ?? "",
        branch.timezone ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    },
  })

  const pageRows = table.getRowModel().rows
  const filteredCount = table.getFilteredRowModel().rows.length
  const firstRow =
    filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const lastRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    filteredCount
  )

  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all"

  function resetPage() {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }

  function refresh() {
    startRefresh(() => {
      router.refresh()
    })
  }

  const editingBranch = editingId
    ? (rows.find((row) => row.id === editingId) ?? null)
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={globalFilter}
            aria-label="Search branches"
            placeholder="Search branches, addresses, or phone numbers…"
            className="pl-8"
            onChange={(event) => {
              table.setGlobalFilter(event.target.value)
              resetPage()
            }}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? undefined : value)
            resetPage()
          }}
          items={STATUS_OPTIONS}
        >
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={refresh} disabled={refreshing}>
          <ArrowsClockwiseIcon
            data-icon="inline-start"
            className={refreshing ? "animate-spin" : undefined}
          />
          Refresh
        </Button>

        {canManage ? <AddBranchSheet /> : null}
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.id === "actions" ? "w-40" : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {rows.length === 0
                    ? "No branches yet. Add the first location to get started."
                    : "No branches match your search or filters."}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
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
            ? "No branches to show"
            : `Showing ${firstRow}–${lastRow} of ${filteredCount}`}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
            items={PAGE_SIZE_ITEMS}
          >
            <SelectTrigger size="sm" className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
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
            Previous
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

      <EditBranchSheet
        branch={editingBranch}
        open={editingBranch !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null)
          }
        }}
      />
    </div>
  )
}
