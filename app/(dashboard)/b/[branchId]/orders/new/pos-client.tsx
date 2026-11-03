"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { toast } from "sonner"

import { createOrderAction } from "../actions"
import { type ActionState, IDLE_ACTION_STATE } from "@/lib/actions/state"
import { type MenuCategory, type MenuItem } from "@/lib/api/types"
import { env } from "@/lib/env-client"
import { formatMoney } from "@/lib/format/money"

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
import { SubmitButton } from "@/components/forms/submit-button"
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
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface POSClientProps {
  branchId: string
  initialCategories: MenuCategory[]
  initialTables: { id: string; label: string; seats: number }[]
}

interface CartItem {
  item: MenuItem
  quantity: number
  notes: string
  modifiers: Array<{ name: string; optionName: string; extraPrice: number }>
}

interface MenuRow {
  item: MenuItem
  categoryName: string
}

const PAGE_SIZE_ITEMS = ["10", "20", "50"].map((value) => ({
  value,
  label: value,
}))

const posFeatures = tableFeatures({
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

const columnHelper = createColumnHelper<typeof posFeatures, MenuRow>()

export function POSClient({
  branchId,
  initialCategories,
  initialTables,
}: POSClientProps) {
  const router = useRouter()
  const [categories] = useState(initialCategories)
  const [tables] = useState(initialTables)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<
    "dine_in" | "takeaway" | "delivery"
  >("dine_in")
  const [cart, setCart] = useState<CartItem[]>([])
  const [clientActionId] = useState(() => crypto.randomUUID())

  const currency = env.NEXT_PUBLIC_DEFAULT_CURRENCY
  const subtotal = cart.reduce(
    (sum, item) => sum + item.item.price * item.quantity,
    0
  )
  const total = subtotal

  const rows = useMemo<MenuRow[]>(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          item,
          categoryName: category.name,
        }))
      ),
    [categories]
  )

  const categoryNames = useMemo(
    () => Array.from(new Set(categories.map((category) => category.name))),
    [categories]
  )

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id && c.notes === "")
      if (existing) {
        return prev.map((c) =>
          c === existing ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [
        ...prev,
        { item, quantity: 1, notes: "", modifiers: item.modifiers },
      ]
    })
  }

  function updateQuantity(index: number, delta: number) {
    setCart((prev) => {
      const newQuantity = prev[index].quantity + delta
      if (newQuantity <= 0) {
        return prev.filter((_, i) => i !== index)
      }
      return prev.map((c, i) =>
        i === index ? { ...c, quantity: newQuantity } : c
      )
    })
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor((row) => row.item.name, {
          id: "name",
          header: ({ column }) => (
            <SortableHeader label="Item" column={column} />
          ),
          sortFn: "alphanumeric",
          cell: ({ row }) => (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{row.original.item.name}</span>
                {!row.original.item.isAvailable ? (
                  <Badge variant="destructive" className="text-[0.65rem]">
                    Hidden
                  </Badge>
                ) : null}
              </div>
              {row.original.item.description ? (
                <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                  {row.original.item.description}
                </p>
              ) : null}
              {row.original.item.modifiers.length > 0 ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.original.item.modifiers
                    .map(
                      (m) =>
                        `${m.optionName} +${formatMoney(m.extraPrice, currency)}`
                    )
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          ),
        }),
        columnHelper.accessor((row) => row.categoryName, {
          id: "category",
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
        columnHelper.accessor((row) => row.item.price, {
          id: "price",
          header: ({ column }) => (
            <div className="flex justify-end">
              <SortableHeader label="Price" column={column} />
            </div>
          ),
          sortFn: "basic",
          enableGlobalFilter: false,
          cell: ({ row }) => (
            <div className="text-right font-medium">
              {formatMoney(row.original.item.price, currency)}
            </div>
          ),
        }),
        columnHelper.display({
          id: "qty",
          header: "Qty",
          cell: ({ row }) => {
            const item = row.original.item
            const index = cart.findIndex(
              (c) => c.item.id === item.id && c.notes === ""
            )
            const quantity = index >= 0 ? cart[index].quantity : 0

            if (!item.isAvailable) {
              return <span className="text-xs text-muted-foreground">—</span>
            }

            if (quantity === 0) {
              return (
                <Button
                  size="sm"
                  onClick={() => addToCart(item)}
                  className="w-20"
                >
                  Add
                </Button>
              )
            }

            return (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => updateQuantity(index, -1)}
                  aria-label={`Decrease ${item.name}`}
                >
                  −
                </Button>
                <span className="w-6 text-center text-sm font-medium">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => updateQuantity(index, 1)}
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFromCart(index)}
                  aria-label={`Remove ${item.name}`}
                  className="text-destructive hover:text-destructive"
                >
                  ✕
                </Button>
              </div>
            )
          },
        }),
      ]),
    [currency, cart]
  )

  const table = useTable({
    features: posFeatures,
    columns,
    data: rows,
    getRowId: (row) => row.item.id,
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

      const item = row.original.item
      return [
        item.name,
        item.description ?? "",
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
    (table.getColumn("category")?.getFilterValue() as string | undefined) ??
    "all"

  function resetPage() {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }

  function makeCreateOrderAction() {
    return async (
      _prev: ActionState,
      formData: FormData
    ): Promise<ActionState> => {
      const itemsInput = formData.get("items") as string
      if (!itemsInput) return { status: "error", message: "No items in order" }
      try {
        JSON.parse(itemsInput)
      } catch {
        return { status: "error", message: "Invalid items payload" }
      }
      const formDataCopy = new FormData()
      formDataCopy.append("branchId", branchId)
      formDataCopy.append("tableId", selectedTableId ?? "")
      formDataCopy.append("orderType", orderType)
      formDataCopy.append("clientActionId", clientActionId)
      formDataCopy.append("items", itemsInput)
      formDataCopy.append("taxAmount", "0")
      formDataCopy.append("discountAmount", "0")
      return createOrderAction({ status: "idle" }, formDataCopy)
    }
  }

  const [state, formAction] = useActionState(
    makeCreateOrderAction(),
    IDLE_ACTION_STATE
  )

  const itemsJson = JSON.stringify(
    cart.map((c) => ({
      menuItemId: c.item.id,
      quantity: c.quantity,
      notes: c.notes || null,
      modifiers: c.modifiers,
    }))
  )

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Order placed successfully!", {
        description: `Order #${state.orderId?.slice(0, 8) || ""} placed`,
        action: {
          label: "View",
          onClick: () => router.replace(`/b/${branchId}/orders`),
        },
      })
      router.replace(`/b/${branchId}/orders`)
      router.refresh()
    }
  }, [state, router, branchId])

  if (orderType === "dine_in" && !selectedTableId && tables.length > 0) {
    setSelectedTableId(tables[0].id)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/b/${branchId}/orders`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            ← Orders
          </Link>
          <h2 className="text-sm font-semibold">New Order</h2>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={orderType}
            onValueChange={(value) =>
              setOrderType(value as "dine_in" | "takeaway" | "delivery")
            }
          >
            <TabsList>
              <TabsTrigger value="dine_in">Dine-in</TabsTrigger>
              <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
            </TabsList>
          </Tabs>
          {orderType === "dine_in" ? (
            <Select
              value={selectedTableId ?? ""}
              onValueChange={(value) => setSelectedTableId(value || null)}
              items={tables.map((table) => ({
                value: table.id,
                label: `${table.label} (${table.seats} seats)`,
              }))}
            >
              <SelectTrigger className="w-48" aria-label="Table">
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.label} ({table.seats} seats)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Input
                type="search"
                value={globalFilter}
                aria-label="Search menu items"
                placeholder="Search items, descriptions, or categories…"
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
                  .getColumn("category")
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
          </div>

          <div className="mt-3 flex-1 overflow-hidden rounded-xl border bg-background">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={header.id === "qty" ? "w-44" : undefined}
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
                            cell.column.id === "price"
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {filteredCount === 0
                ? "No items to show"
                : `Showing ${firstRow}–${lastRow} of ${filteredCount}`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Rows per page
              </span>
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

        <aside className="w-80 flex-shrink-0 border-l bg-background p-4">
          <div className="flex h-full flex-col gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Order summary
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatMoney(total, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {cart.reduce((t, c) => t + c.quantity, 0)} item
                {cart.reduce((t, c) => t + c.quantity, 0) === 1 ? "" : "s"}
              </p>
            </div>

            <Separator />

            <div className="flex-1 space-y-2 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add items from the table.
                </p>
              ) : (
                <ul className="space-y-2">
                  {cart.map((cartItem, index) => (
                    <li
                      key={index}
                      className="rounded-lg border bg-muted/30 p-2.5 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">
                          {cartItem.quantity}× {cartItem.item.name}
                        </span>
                        <span className="shrink-0 font-medium">
                          {formatMoney(
                            cartItem.item.price * cartItem.quantity,
                            currency
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form action={formAction} className="space-y-2">
              <input type="hidden" name="branchId" value={branchId} />
              <input
                type="hidden"
                name="tableId"
                value={selectedTableId ?? ""}
              />
              <input type="hidden" name="orderType" value={orderType} />
              <input
                type="hidden"
                name="clientActionId"
                value={clientActionId}
              />
              <input type="hidden" name="items" value={itemsJson} />
              <input type="hidden" name="taxAmount" value="0" />
              <input type="hidden" name="discountAmount" value="0" />

              <SubmitButton
                disabled={
                  cart.length === 0 ||
                  (orderType === "dine_in" && !selectedTableId) ||
                  state.status !== "idle"
                }
                className="w-full"
              >
                {cart.length === 0
                  ? "Add items to order"
                  : `Place order — ${formatMoney(total, currency)}`}
              </SubmitButton>
            </form>
            {state.status === "error" ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
