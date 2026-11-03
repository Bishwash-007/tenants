"use client"

import { useMemo, useState } from "react"
import { MagnifyingGlassIcon, PencilSimpleIcon } from "@phosphor-icons/react"
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
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
import type { MenuCategory, MenuItem } from "@/lib/api/types"
import { env } from "@/lib/env-client"
import { formatMoney } from "@/lib/format/money"

import { AddCategorySheet } from "./add-category-sheet"
import { AddItemSheet } from "./add-item-sheet"
import { EditItemSheet } from "./edit-item-sheet"
import { ItemAvailabilitySwitch } from "./item-availability-switch"

interface MenuRow extends MenuItem {
  categoryName: string
}

interface MenuTableProps {
  categories: MenuCategory[]
  branchId: string
  scope: "branch" | "org"
  canWrite: boolean
}

const menuFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
  },
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
})

const columnHelper = createColumnHelper<typeof menuFeatures, MenuRow>()

const PAGE_SIZE_ITEMS = ["10", "20", "50"].map((value) => ({
  value,
  label: value,
}))

export function MenuTable({
  categories,
  branchId,
  scope,
  canWrite,
}: MenuTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const currency = env.NEXT_PUBLIC_DEFAULT_CURRENCY

  const rows = useMemo<MenuRow[]>(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          ...item,
          categoryName: category.name,
        }))
      ),
    [categories]
  )

  const categoryNames = useMemo(
    () => Array.from(new Set(categories.map((category) => category.name))),
    [categories]
  )

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: ({ column }) => (
            <SortableHeader label="Item" column={column} />
          ),
          sortFn: "alphanumeric",
          cell: ({ row }) => (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{row.original.name}</span>
                {row.original.branchId ? (
                  <Badge variant="outline" className="text-[0.65rem]">
                    Branch
                  </Badge>
                ) : null}
              </div>
              {row.original.description ? (
                <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                  {row.original.description}
                </p>
              ) : null}
            </div>
          ),
        }),
        columnHelper.accessor("categoryName", {
          header: ({ column }) => (
            <SortableHeader label="Category" column={column} />
          ),
          sortFn: "alphanumeric",
          filterFn: "equalsString",
          cell: ({ getValue }) => (
            <Badge variant="secondary" className="text-xs">
              {getValue()}
            </Badge>
          ),
        }),
        columnHelper.accessor("price", {
          header: ({ column }) => (
            <div className="flex justify-end">
              <SortableHeader label="Price" column={column} />
            </div>
          ),
          sortFn: "basic",
          enableGlobalFilter: false,
          cell: ({ row }) => (
            <div className="text-right">
              <p className="font-medium">
                {formatMoney(row.original.price, currency)}
              </p>
              {row.original.price !== row.original.basePrice ? (
                <p className="text-xs text-muted-foreground">
                  base {formatMoney(row.original.basePrice, currency)}
                </p>
              ) : null}
            </div>
          ),
        }),
        columnHelper.accessor((row) => row.modifiers.length, {
          id: "modifierCount",
          header: ({ column }) => (
            <SortableHeader label="Modifiers" column={column} />
          ),
          sortFn: "basic",
          enableGlobalFilter: false,
          cell: ({ getValue }) =>
            getValue() > 0 ? (
              <Badge variant="outline">{getValue()}</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            ),
        }),
        columnHelper.accessor("isAvailable", {
          header: "Status",
          enableSorting: false,
          enableGlobalFilter: false,
          cell: ({ getValue }) =>
            getValue() ? (
              <Badge variant="secondary">Available</Badge>
            ) : (
              <Badge variant="destructive">Hidden</Badge>
            ),
        }),
        columnHelper.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          cell: ({ row }) => (
            <div className="flex items-center justify-end gap-1">
              {canWrite ? (
                <>
                  <ItemAvailabilitySwitch
                    itemId={row.original.id}
                    itemName={row.original.name}
                    isAvailable={row.original.isAvailable}
                    showLabel={false}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${row.original.name}`}
                    onClick={() => setEditingId(row.original.id)}
                  >
                    <PencilSimpleIcon />
                  </Button>
                </>
              ) : null}
            </div>
          ),
        }),
      ]),
    [canWrite, currency]
  )

  const table = useTable({
    features: menuFeatures,
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

      return [
        row.original.name,
        row.original.description ?? "",
        row.original.categoryName,
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

  const categoryFilter =
    (table.getColumn("categoryName")?.getFilterValue() as string | undefined) ??
    "all"

  function resetPage() {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }

  const editingItem = editingId
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
            aria-label="Search menu items"
            placeholder="Search items, descriptions, or categories…"
            className="pl-8"
            onChange={(event) => {
              table.setGlobalFilter(event.target.value)
              resetPage()
            }}
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            table
              .getColumn("categoryName")
              ?.setFilterValue(value === "all" ? undefined : value)
            resetPage()
          }}
          items={[
            { value: "all", label: "All categories" },
            ...categoryNames.map((name) => ({ value: name, label: name })),
          ]}
        >
          <SelectTrigger className="w-44" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canWrite ? (
          <div className="flex items-center gap-2">
            <AddCategorySheet branchId={branchId} scope={scope} />
            <AddItemSheet
              branchId={branchId}
              scope={scope}
              categories={categories}
            />
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.id === "actions" ? "w-24" : undefined}
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
                    ? "Nothing on this menu yet."
                    : "No items match your search or filters."}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "price" ? "text-right" : undefined
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
            ? "No items to show"
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

      <EditItemSheet
        item={editingItem}
        categories={categories}
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null)
          }
        }}
      />
    </div>
  )
}
