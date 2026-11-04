"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { tableStatusLabel } from "@/lib/api/normalizers"
import type { Table } from "@/lib/api/types"

import { TableBillSheet } from "./table-bill-sheet"

const STATUS_VARIANTS = {
  free: "secondary",
  occupied: "destructive",
  reserved: "outline",
} as const

interface TablesClientProps {
  branchId: string
  tables: Table[]
  canManage: boolean
}

export function TablesClient({
  branchId,
  tables,
  canManage,
}: TablesClientProps) {
  const [openTableId, setOpenTableId] = useState<string | null>(null)
  const openTable = tables.find((table) => table.id === openTableId) ?? null

  if (tables.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-background p-8 text-center">
        <p className="text-sm font-medium">No tables yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {canManage
            ? "Add the first table above. Dine-in orders will use it."
            : "Ask a manager to add tables for this branch."}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tables.map((table) => (
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
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setOpenTableId(table.id)}
              >
                Bill & checkout
              </Button>
            </div>
          </div>
        ))}
      </div>

      {openTable ? (
        <TableBillSheet
          branchId={branchId}
          tableId={openTable.id}
          tableLabel={openTable.label}
          open={openTableId !== null}
          onOpenChange={(open) => {
            if (!open) setOpenTableId(null)
          }}
        />
      ) : null}
    </>
  )
}
