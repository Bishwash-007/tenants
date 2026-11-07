"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowsClockwiseIcon,
  MagnifyingGlassIcon,
  ReceiptIcon,
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
import { env } from "@/lib/env-client"
import { formatMoney } from "@/lib/format/money"
import {
  STATUS_LABELS,
  STATUS_SEQUENCE,
  formatAge,
  orderTypeLabel,
  statusLabel,
  statusSortRank,
  statusVariant,
  type KDSOrder,
} from "@/lib/kds/types"

const orderFeatures = tableFeatures({
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

const columnHelper = createColumnHelper<typeof orderFeatures, KDSOrder>()

const PAGE_SIZE_ITEMS = ["10", "20", "50"].map((value) => ({
  value,
  label: value,
}))

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...STATUS_SEQUENCE.map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
  })),
]

interface OrderTicketsTableProps {
  orders: KDSOrder[]
  refreshing: boolean
  onOpenOrder: (orderId: string) => void
  onRefresh: () => void
  emptyMessage?: string
}

export function OrderTicketsTable({
  orders,
  refreshing,
  onOpenOrder,
  onRefresh,
  emptyMessage = "No active tickets. New orders appear here as they are placed.",
}: OrderTicketsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    // Newest tickets first.
    { id: "occurredAt", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // Relative ages would otherwise freeze until the next socket event.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [])

  const currency = env.NEXT_PUBLIC_DEFAULT_CURRENCY

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("id", {
          header: ({ column }) => (
            <SortableHeader label="Order" column={column} />
          ),
          sortFn: "alphanumeric",
          cell: ({ row }) => (
            <div>
              <p className="font-mono text-sm font-medium">
                #{row.original.id.slice(0, 8)}
              </p>
              <p className="text-xs text-muted-foreground">
                {orderTypeLabel(row.original.orderType)}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor((row) => row.tableLabel ?? row.tableId ?? "", {
          id: "table",
          header: "Table",
          enableSorting: false,
          cell: ({ row }) => {
            const label = row.original.tableLabel
            const id = row.original.tableId
            if (label) {
              return <span className="text-sm">{label}</span>
            }
            if (id) {
              return (
                <span className="font-mono text-xs">#{id.slice(0, 8)}</span>
              )
            }
            return <span className="text-xs text-muted-foreground">—</span>
          },
        }),
        columnHelper.accessor((row) => row.items.length, {
          id: "items",
          header: ({ column }) => (
            <SortableHeader label="Items" column={column} />
          ),
          sortFn: "basic",
          enableGlobalFilter: false,
          cell: ({ row }) => {
            const items = row.original.items

            if (items.length === 0) {
              return <span className="text-xs text-muted-foreground">—</span>
            }

            return (
              <div className="max-w-56">
                <p className="text-sm">
                  {items.reduce((total, item) => total + item.quantity, 0)}{" "}
                  {items.length === 1 ? "line" : "lines"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {items
                    .map((item) => `${item.quantity}× ${item.name}`)
                    .join(", ")}
                </p>
              </div>
            )
          },
        }),
        columnHelper.accessor("status", {
          header: ({ column }) => (
            <SortableHeader label="Status" column={column} />
          ),
          sortFn: (rowA, rowB) =>
            statusSortRank(rowA.original.status) -
            statusSortRank(rowB.original.status),
          filterFn: "equalsString",
          cell: ({ getValue }) => (
            <Badge variant={statusVariant(getValue())}>
              {statusLabel(getValue())}
            </Badge>
          ),
        }),
        columnHelper.accessor("totalAmount", {
          header: ({ column }) => (
            <div className="flex justify-end">
              <SortableHeader label="Total" column={column} />
            </div>
          ),
          sortFn: "basic",
          enableGlobalFilter: false,
          cell: ({ getValue }) => (
            <div className="text-right font-medium">
              {formatMoney(getValue(), currency)}
            </div>
          ),
        }),
        columnHelper.accessor("occurredAt", {
          header: ({ column }) => (
            <SortableHeader label="Age" column={column} />
          ),
          sortFn: "alphanumeric",
          enableGlobalFilter: false,
          cell: ({ getValue }) => (
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              {formatAge(getValue(), now)}
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          cell: ({ row }) => (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Open order ${row.original.id.slice(0, 8)}`}
                onClick={() => onOpenOrder(row.original.id)}
              >
                <ReceiptIcon />
              </Button>
            </div>
          ),
        }),
      ]),
    [currency, now, onOpenOrder]
  )

  const table = useTable({
    features: orderFeatures,
    columns,
    data: orders,
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

      const order = row.original

      return [
        order.id,
        order.orderType,
        orderTypeLabel(order.orderType),
        order.tableId ?? "",
        statusLabel(order.status),
        ...order.items.flatMap((item) => [item.name, item.notes ?? ""]),
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={globalFilter}
            aria-label="Search tickets"
            placeholder="Search orders, tables, items…"
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
          <SelectTrigger className="w-44" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_SEQUENCE.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
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
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.id === "actions" ? "w-12" : undefined}
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
                  {orders.length === 0
                    ? emptyMessage
                    : "No tickets match your search or filters."}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => onOpenOrder(row.original.id)}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "totalAmount" ||
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
            ? "No tickets to show"
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
    </div>
  )
}
