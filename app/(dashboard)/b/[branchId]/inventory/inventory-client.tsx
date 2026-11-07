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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type {
  InventoryItem,
  Supplier,
  Discrepancy,
  StockMovement,
} from "@/lib/api/endpoints/inventory"
import type { MenuNode } from "@/lib/api/types"
import { isMenuCategory } from "@/lib/api/types"

import { toast } from "sonner"
import { IDLE_ACTION_STATE } from "@/lib/actions/state"
import { FieldError } from "@/components/forms/action-message"
import { useActionToast } from "@/hooks/use-action-toast"
import { useActionSuccess } from "@/hooks/use-action-success"
import { SubmitButton } from "@/components/forms/submit-button"
import { Label } from "@/components/ui/label"
import {
  createInventoryItemAction,
  createSupplierAction,
  deleteSupplierAction,
  stockInAction,
  adjustStockAction,
  setReorderThresholdAction,
  attachRecipeAction,
  updateSupplierAction,
  listMovementsAction,
} from "./actions"

interface Props {
  branchId: string
  items: InventoryItem[]
  suppliers: Supplier[]
  discrepancies: Discrepancy[]
  menu: MenuNode[]
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

function supplierName(suppliers: Supplier[], id: string | null) {
  return suppliers.find((s) => s.id === id)?.name ?? "—"
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

export function InventoryClient({
  branchId,
  items,
  suppliers,
  discrepancies,
  menu,
  canManage,
}: Props) {
  const router = useRouter()
  const menuItems = menu.filter(isMenuCategory).flatMap((c) => c.items)

  const [tab, setTab] = useState("items")
  const [createItemOpen, setCreateItemOpen] = useState(false)
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [stockInItem, setStockInItem] = useState<InventoryItem | null>(null)
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null)
  const [thresholdItem, setThresholdItem] = useState<InventoryItem | null>(null)
  const [recipeItem, setRecipeItem] = useState<InventoryItem | null>(null)
  const [movementsItem, setMovementsItem] = useState<InventoryItem | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)

  const [refreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(() => router.refresh())
  }

  // Items table state
  const [itemsSorting, setItemsSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ])
  const [itemsGlobal, setItemsGlobal] = useState("")
  const [itemsPagination, setItemsPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const itemsColumnHelper = useMemo(
    () => createColumnHelper<typeof features, InventoryItem>(),
    []
  )
  const itemsColumns = useMemo(() => {
    const base = itemsColumnHelper.columns([
      itemsColumnHelper.accessor("name", {
        header: ({ column }) => <SortableHeader label="Name" column={column} />,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.name}
            {row.original.quantityOnHand <= row.original.reorderThreshold ? (
              <Badge variant="destructive" className="ml-2">
                Low
              </Badge>
            ) : null}
          </span>
        ),
      }),
      itemsColumnHelper.accessor("unit", {
        header: ({ column }) => <SortableHeader label="Unit" column={column} />,
      }),
      itemsColumnHelper.accessor("quantityOnHand", {
        header: ({ column }) => (
          <SortableHeader label="On hand" column={column} />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.quantityOnHand}</span>
        ),
      }),
      itemsColumnHelper.accessor("reorderThreshold", {
        header: ({ column }) => (
          <SortableHeader label="Reorder at" column={column} />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.reorderThreshold}</span>
        ),
      }),
      itemsColumnHelper.accessor((r) => supplierName(suppliers, r.supplierId), {
        id: "supplier",
        header: ({ column }) => (
          <SortableHeader label="Supplier" column={column} />
        ),
      }),
    ])
    if (!canManage) return base
    return [
      ...base,
      itemsColumnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStockInItem(row.original)}
            >
              Stock in
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdjustItem(row.original)}
            >
              Adjust
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setThresholdItem(row.original)}
            >
              Threshold
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRecipeItem(row.original)}
            >
              Recipe
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMovementsItem(row.original)
                loadMovements(row.original.id)
              }}
            >
              Moves
            </Button>
          </div>
        ),
      }),
    ]
  }, [canManage, suppliers])

  const itemsTable = useTable({
    features,
    columns: itemsColumns,
    data: items,
    getRowId: (r) => r.id,
    state: {
      sorting: itemsSorting,
      globalFilter: itemsGlobal,
      pagination: itemsPagination,
    },
    onSortingChange: setItemsSorting,
    onGlobalFilterChange: (u) =>
      setItemsGlobal((p) => (typeof u === "function" ? u(p) : u)),
    onPaginationChange: setItemsPagination,
    globalFilterFn: (row, _c, fv) => {
      const q = String(fv ?? "")
        .trim()
        .toLowerCase()
      if (!q) return true
      const it = row.original
      return [it.name, it.unit, supplierName(suppliers, it.supplierId)].some(
        (v) => v.toLowerCase().includes(q)
      )
    },
  })

  function loadMovements(id: string) {
    setMovementsLoading(true)
    void (async () => {
      const res = await listMovementsAction(id)
      setMovements(res)
      setMovementsLoading(false)
    })()
  }

  // Suppliers table
  const [suppliersSorting, setSuppliersSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ])
  const [suppliersGlobal, setSuppliersGlobal] = useState("")
  const [suppliersPagination, setSuppliersPagination] =
    useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const suppliersColumnHelper = useMemo(
    () => createColumnHelper<typeof features, Supplier>(),
    []
  )
  const suppliersColumns = useMemo(() => {
    const base = suppliersColumnHelper.columns([
      suppliersColumnHelper.accessor("name", {
        header: ({ column }) => <SortableHeader label="Name" column={column} />,
      }),
      suppliersColumnHelper.accessor((r) => r.contact_phone ?? "", {
        id: "phone",
        header: ({ column }) => (
          <SortableHeader label="Phone" column={column} />
        ),
      }),
      suppliersColumnHelper.accessor((r) => r.contact_email ?? "", {
        id: "email",
        header: ({ column }) => (
          <SortableHeader label="Email" column={column} />
        ),
      }),
    ])
    if (!canManage) return base
    return [
      ...base,
      suppliersColumnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingSupplier(row.original)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                const res = await deleteSupplierAction(row.original.id)
                if (res.status === "success") {
                  toast.success(res.message ?? "Supplier deleted.")
                  refresh()
                } else {
                  toast.error(res.message ?? "Failed to delete supplier.")
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ]
  }, [canManage])

  const suppliersTable = useTable({
    features,
    columns: suppliersColumns,
    data: suppliers,
    getRowId: (r) => r.id,
    state: {
      sorting: suppliersSorting,
      globalFilter: suppliersGlobal,
      pagination: suppliersPagination,
    },
    onSortingChange: setSuppliersSorting,
    onGlobalFilterChange: (u) =>
      setSuppliersGlobal((p) => (typeof u === "function" ? u(p) : u)),
    onPaginationChange: setSuppliersPagination,
    globalFilterFn: (row, _c, fv) => {
      const q = String(fv ?? "")
        .trim()
        .toLowerCase()
      if (!q) return true
      const s = row.original
      return [s.name, s.contact_phone ?? "", s.contact_email ?? ""].some((v) =>
        v.toLowerCase().includes(q)
      )
    },
  })

  // Discrepancies table
  const [discGlobal, setDiscGlobal] = useState("")
  const [discPagination, setDiscPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [discSorting, setDiscSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ])

  const discColumnHelper = useMemo(
    () => createColumnHelper<typeof features, Discrepancy>(),
    []
  )
  const discColumns = useMemo(
    () =>
      discColumnHelper.columns([
        discColumnHelper.accessor("status", {
          header: ({ column }) => (
            <SortableHeader label="Status" column={column} />
          ),
          cell: ({ row }) => (
            <Badge
              variant={
                row.original.status === "failed" ? "destructive" : "secondary"
              }
            >
              {row.original.status}
            </Badge>
          ),
        }),
        discColumnHelper.accessor((r) => r.order_id.slice(0, 8), {
          id: "order",
          header: ({ column }) => (
            <SortableHeader label="Order" column={column} />
          ),
        }),
        discColumnHelper.accessor("detail", {
          header: ({ column }) => (
            <SortableHeader label="Detail" column={column} />
          ),
        }),
        discColumnHelper.accessor("created_at", {
          header: ({ column }) => (
            <SortableHeader label="Created" column={column} />
          ),
          cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
              {new Date(row.original.created_at).toLocaleString()}
            </span>
          ),
        }),
      ]),
    []
  )

  const discTable = useTable({
    features,
    columns: discColumns,
    data: discrepancies,
    getRowId: (r) => r.id,
    state: {
      sorting: discSorting,
      globalFilter: discGlobal,
      pagination: discPagination,
    },
    onSortingChange: setDiscSorting,
    onGlobalFilterChange: (u) =>
      setDiscGlobal((p) => (typeof u === "function" ? u(p) : u)),
    onPaginationChange: setDiscPagination,
    globalFilterFn: (row, _c, fv) => {
      const q = String(fv ?? "")
        .trim()
        .toLowerCase()
      if (!q) return true
      const d = row.original
      return [d.status, d.order_id, d.detail].some((v) =>
        v.toLowerCase().includes(q)
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
                    className={h.id === "actions" ? "w-40" : undefined}
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

  // Items pagination helpers
  const itemsFilteredCount = itemsTable.getFilteredRowModel().rows.length
  const itemsFirst =
    itemsFilteredCount === 0
      ? 0
      : itemsPagination.pageIndex * itemsPagination.pageSize + 1
  const itemsLast = Math.min(
    (itemsPagination.pageIndex + 1) * itemsPagination.pageSize,
    itemsFilteredCount
  )

  const suppliersFilteredCount =
    suppliersTable.getFilteredRowModel().rows.length
  const suppliersFirst =
    suppliersFilteredCount === 0
      ? 0
      : suppliersPagination.pageIndex * suppliersPagination.pageSize + 1
  const suppliersLast = Math.min(
    (suppliersPagination.pageIndex + 1) * suppliersPagination.pageSize,
    suppliersFilteredCount
  )

  const discFilteredCount = discTable.getFilteredRowModel().rows.length
  const discFirst =
    discFilteredCount === 0
      ? 0
      : discPagination.pageIndex * discPagination.pageSize + 1
  const discLast = Math.min(
    (discPagination.pageIndex + 1) * discPagination.pageSize,
    discFilteredCount
  )

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="discrepancies">Discrepancies</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Inventory items</h2>
            {canManage ? (
              <Button size="sm" onClick={() => setCreateItemOpen(true)}>
                Add item
              </Button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <Empty text="No inventory items yet." />
          ) : (
            renderTable(
              itemsTable,
              itemsGlobal,
              setItemsGlobal,
              itemsPagination,
              itemsFilteredCount,
              itemsFirst,
              itemsLast,
              "No inventory items yet.",
              items
            )
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Suppliers</h2>
            {canManage ? (
              <Button size="sm" onClick={() => setCreateSupplierOpen(true)}>
                Add supplier
              </Button>
            ) : null}
          </div>
          {suppliers.length === 0 ? (
            <Empty text="No suppliers yet." />
          ) : (
            renderTable(
              suppliersTable,
              suppliersGlobal,
              setSuppliersGlobal,
              suppliersPagination,
              suppliersFilteredCount,
              suppliersFirst,
              suppliersLast,
              "No suppliers yet.",
              suppliers
            )
          )}
        </TabsContent>

        <TabsContent value="discrepancies" className="space-y-4">
          <h2 className="text-sm font-semibold">Discrepancies</h2>
          {discrepancies.length === 0 ? (
            <Empty text="No discrepancies." />
          ) : (
            renderTable(
              discTable,
              discGlobal,
              setDiscGlobal,
              discPagination,
              discFilteredCount,
              discFirst,
              discLast,
              "No discrepancies.",
              discrepancies
            )
          )}
        </TabsContent>
      </Tabs>

      {/* sheets unchanged */}
      <Sheet open={createItemOpen} onOpenChange={setCreateItemOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add inventory item</SheetTitle>
            <SheetDescription>Track stock for this branch.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <CreateItemForm
              branchId={branchId}
              suppliers={suppliers}
              onDone={() => setCreateItemOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={createSupplierOpen} onOpenChange={setCreateSupplierOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add supplier</SheetTitle>
            <SheetDescription>Tenant-wide supplier.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <SupplierForm onDone={() => setCreateSupplierOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={editingSupplier !== null}
        onOpenChange={(o) => {
          if (!o) setEditingSupplier(null)
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit supplier</SheetTitle>
            <SheetDescription />
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {editingSupplier ? (
              <SupplierForm
                supplier={editingSupplier}
                onDone={() => setEditingSupplier(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={stockInItem !== null}
        onOpenChange={(o) => {
          if (!o) setStockInItem(null)
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Stock in — {stockInItem?.name}</SheetTitle>
            <SheetDescription>Counted quantity received.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {stockInItem ? (
              <StockInForm
                item={stockInItem}
                branchId={branchId}
                onDone={() => setStockInItem(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={adjustItem !== null}
        onOpenChange={(o) => {
          if (!o) setAdjustItem(null)
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Adjust stock — {adjustItem?.name}</SheetTitle>
            <SheetDescription>
              Signed delta with a mandatory note.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {adjustItem ? (
              <AdjustForm
                item={adjustItem}
                branchId={branchId}
                onDone={() => setAdjustItem(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={thresholdItem !== null}
        onOpenChange={(o) => {
          if (!o) setThresholdItem(null)
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Reorder threshold — {thresholdItem?.name}</SheetTitle>
            <SheetDescription />
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {thresholdItem ? (
              <ThresholdForm
                item={thresholdItem}
                branchId={branchId}
                onDone={() => setThresholdItem(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={recipeItem !== null}
        onOpenChange={(o) => {
          if (!o) setRecipeItem(null)
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              Attach recipe ingredient — {recipeItem?.name}
            </SheetTitle>
            <SheetDescription>
              Links a menu item to this inventory item.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {recipeItem ? (
              <RecipeForm
                item={recipeItem}
                branchId={branchId}
                menuItems={menuItems}
                onDone={() => setRecipeItem(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={movementsItem !== null}
        onOpenChange={(o) => {
          if (!o) setMovementsItem(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movements — {movementsItem?.name}</DialogTitle>
          </DialogHeader>
          {movementsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No movements yet.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
              {movements.map((m) => (
                <li key={m.id} className="rounded-md border p-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{m.movementType}</span>
                    <span className="tabular-nums">{m.quantity}</span>
                  </div>
                  {m.note ? (
                    <p className="text-xs text-muted-foreground">{m.note}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Form components (kept)
function CreateItemForm({
  branchId,
  suppliers,
  onDone,
}: {
  branchId: string
  suppliers: Supplier[]
  onDone: () => void
}) {
  const [state, formAction] = useActionState(
    createInventoryItemAction,
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
        <Label>Name</Label>
        <Input name="name" aria-invalid={Boolean(errors.name)} />
        <FieldError message={errors.name} />
      </div>
      <div className="space-y-1.5">
        <Label>Unit</Label>
        <Input
          name="unit"
          placeholder="kg, l, pcs"
          aria-invalid={Boolean(errors.unit)}
        />
        <FieldError message={errors.unit} />
      </div>
      <div className="space-y-1.5">
        <Label>Quantity on hand</Label>
        <Input
          name="quantityOnHand"
          type="number"
          step="any"
          defaultValue={0}
          aria-invalid={Boolean(errors.quantityOnHand)}
        />
        <FieldError message={errors.quantityOnHand} />
      </div>
      <div className="space-y-1.5">
        <Label>Reorder threshold</Label>
        <Input
          name="reorderThreshold"
          type="number"
          step="any"
          defaultValue={0}
          aria-invalid={Boolean(errors.reorderThreshold)}
        />
        <FieldError message={errors.reorderThreshold} />
      </div>
      <div className="space-y-1.5">
        <Label>Supplier</Label>
        <select
          name="supplierId"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">— none —</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <FieldError message={errors.supplierId} />
      </div>
      <SubmitButton pendingLabel="Adding…" className="w-full">
        Add item
      </SubmitButton>
    </form>
  )
}

function SupplierForm({
  supplier,
  onDone,
}: {
  supplier?: Supplier
  onDone: () => void
}) {
  const action = supplier ? updateSupplierAction : createSupplierAction
  const [state, formAction] = useActionState(action, IDLE_ACTION_STATE)
  const formRef = useRef<HTMLFormElement>(null)
  useActionToast(state)
  useActionSuccess(state, onDone)
  useActionSuccess(state, () => formRef.current?.reset())
  const errors = state.fieldErrors ?? {}
  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {supplier ? <input type="hidden" name="id" value={supplier.id} /> : null}
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          name="name"
          defaultValue={supplier?.name}
          aria-invalid={Boolean(errors.name)}
        />
        <FieldError message={errors.name} />
      </div>
      <div className="space-y-1.5">
        <Label>Contact phone</Label>
        <Input
          name="contactPhone"
          defaultValue={supplier?.contact_phone ?? ""}
          aria-invalid={Boolean(errors.contactPhone)}
        />
        <FieldError message={errors.contactPhone} />
      </div>
      <div className="space-y-1.5">
        <Label>Contact email</Label>
        <Input
          name="contactEmail"
          defaultValue={supplier?.contact_email ?? ""}
          aria-invalid={Boolean(errors.contactEmail)}
        />
        <FieldError message={errors.contactEmail} />
      </div>
      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save
      </SubmitButton>
    </form>
  )
}

function StockInForm({
  item,
  branchId,
  onDone,
}: {
  item: InventoryItem
  branchId: string
  onDone: () => void
}) {
  const [state, formAction] = useActionState(stockInAction, IDLE_ACTION_STATE)
  const formRef = useRef<HTMLFormElement>(null)
  useActionToast(state)
  useActionSuccess(state, onDone)
  useActionSuccess(state, () => formRef.current?.reset())
  const errors = state.fieldErrors ?? {}
  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="branchId" value={branchId} />
      <div className="space-y-1.5">
        <Label>Quantity received</Label>
        <Input
          name="quantity"
          type="number"
          step="any"
          aria-invalid={Boolean(errors.quantity)}
        />
        <FieldError message={errors.quantity} />
      </div>
      <div className="space-y-1.5">
        <Label>Note</Label>
        <Input name="note" aria-invalid={Boolean(errors.note)} />
        <FieldError message={errors.note} />
      </div>
      <SubmitButton pendingLabel="Saving…" className="w-full">
        Receive
      </SubmitButton>
    </form>
  )
}

function AdjustForm({
  item,
  branchId,
  onDone,
}: {
  item: InventoryItem
  branchId: string
  onDone: () => void
}) {
  const [state, formAction] = useActionState(
    adjustStockAction,
    IDLE_ACTION_STATE
  )
  const formRef = useRef<HTMLFormElement>(null)
  useActionToast(state)
  useActionSuccess(state, onDone)
  useActionSuccess(state, () => formRef.current?.reset())
  const errors = state.fieldErrors ?? {}
  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="branchId" value={branchId} />
      <div className="space-y-1.5">
        <Label>Signed delta</Label>
        <Input
          name="quantity"
          type="number"
          step="any"
          aria-invalid={Boolean(errors.quantity)}
        />
        <FieldError message={errors.quantity} />
      </div>
      <div className="space-y-1.5">
        <Label>Note (required)</Label>
        <Input name="note" aria-invalid={Boolean(errors.note)} />
        <FieldError message={errors.note} />
      </div>
      <SubmitButton pendingLabel="Saving…" className="w-full">
        Adjust
      </SubmitButton>
    </form>
  )
}

function ThresholdForm({
  item,
  branchId,
  onDone,
}: {
  item: InventoryItem
  branchId: string
  onDone: () => void
}) {
  const [state, formAction] = useActionState(
    setReorderThresholdAction,
    IDLE_ACTION_STATE
  )
  const formRef = useRef<HTMLFormElement>(null)
  useActionToast(state)
  useActionSuccess(state, onDone)
  useActionSuccess(state, () => formRef.current?.reset())
  const errors = state.fieldErrors ?? {}
  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="branchId" value={branchId} />
      <div className="space-y-1.5">
        <Label>Reorder threshold</Label>
        <Input
          name="reorderThreshold"
          type="number"
          step="any"
          defaultValue={item.reorderThreshold}
          aria-invalid={Boolean(errors.reorderThreshold)}
        />
        <FieldError message={errors.reorderThreshold} />
      </div>
      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save
      </SubmitButton>
    </form>
  )
}

function RecipeForm({
  item,
  branchId,
  menuItems,
  onDone,
}: {
  item: InventoryItem
  branchId: string
  menuItems: { id: string; name: string }[]
  onDone: () => void
}) {
  const [state, formAction] = useActionState(
    attachRecipeAction,
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
      <input type="hidden" name="inventoryItemId" value={item.id} />
      <div className="space-y-1.5">
        <Label>Menu item</Label>
        <select
          name="menuItemId"
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          aria-invalid={Boolean(errors.menuItemId)}
        >
          {menuItems.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <FieldError message={errors.menuItemId} />
      </div>
      <div className="space-y-1.5">
        <Label>Quantity used per unit</Label>
        <Input
          name="quantityUsed"
          type="number"
          step="any"
          defaultValue={1}
          aria-invalid={Boolean(errors.quantityUsed)}
        />
        <FieldError message={errors.quantityUsed} />
      </div>
      <SubmitButton pendingLabel="Attaching…" className="w-full">
        Attach
      </SubmitButton>
    </form>
  )
}
