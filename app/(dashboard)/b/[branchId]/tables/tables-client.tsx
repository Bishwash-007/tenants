"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "cn"

import { ArrowsClockwiseIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

import { tableStatusLabel } from "@/lib/api/normalizers"
import type { Table } from "@/lib/api/types"

import { TableBillSheet } from "./table-bill-sheet"
import type { PrintBranch } from "./print-bill"
import { TableCreateForm } from "./table-create-form"

const STATUS_VARIANTS = {
  free: "secondary",
  occupied: "outline",
  reserved: "outline",
} as const

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "free", label: "Free" },
  { value: "occupied", label: "Occupied" },
  { value: "reserved", label: "Reserved" },
]

interface TablesClientProps {
  branchId: string
  branch: PrintBranch
  tables: Table[]
  canManage: boolean
  canCreateOrder: boolean
}

export function TablesClient({
  branchId,
  branch,
  tables,
  canManage,
  canCreateOrder,
}: TablesClientProps) {
  const router = useRouter()
  const [openTableId, setOpenTableId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [refreshing, startRefresh] = useTransition()

  const openTable = tables.find((table) => table.id === openTableId) ?? null

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tables.filter((table) => {
      if (statusFilter !== "all" && table.status !== statusFilter) {
        return false
      }
      if (!query) {
        return true
      }
      return [
        table.label,
        tableStatusLabel(table.status),
        String(table.seats),
      ].some((value) => value.toLowerCase().includes(query))
    })
  }, [tables, search, statusFilter])

  function refresh() {
    startRefresh(() => {
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            aria-label="Search tables"
            placeholder="Search tables, status, or seats…"
            className="pl-8"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value ?? "all")}
          items={STATUS_OPTIONS}
        >
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={refresh} disabled={refreshing}>
          <ArrowsClockwiseIcon
            data-icon="inline-start"
            className={refreshing ? "animate-spin" : undefined}
          />
          Refresh
        </Button>

        {canManage ? (
          <Button onClick={() => setAddOpen(true)}>Add table</Button>
        ) : null}
      </div>

      {tables.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background p-8 text-center">
          <p className="text-sm font-medium">No tables yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? "Add the first table using the button above."
              : "Ask a manager to add tables for this branch."}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background p-8 text-center">
          <p className="text-sm font-medium">No tables match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((table) => (
            <div key={table.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-semibold">{table.label}</p>
                <Badge variant={STATUS_VARIANTS[table.status]}>
                  {tableStatusLabel(table.status)}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {table.seats} seat{table.seats === 1 ? "" : "s"}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {canCreateOrder ? (
                  <Link
                    href={`/b/${branchId}/orders/new?tableId=${table.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full"
                    )}
                  >
                    Add order
                  </Link>
                ) : null}
                <Button
                  size="sm"
                  className="w-full"
                  disabled={table.status === "free"}
                  onClick={() => setOpenTableId(table.id)}
                >
                  Bill &amp; checkout
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {openTable ? (
        <TableBillSheet
          branchId={branchId}
          branch={branch}
          tableId={openTable.id}
          tableLabel={openTable.label}
          open={openTableId !== null}
          onOpenChange={(open) => {
            if (!open) setOpenTableId(null)
          }}
        />
      ) : null}

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add a table</SheetTitle>
            <SheetDescription>
              Labels are unique within the branch.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <TableCreateForm
              branchId={branchId}
              onSuccess={() => setAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
