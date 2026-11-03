"use client"

import {
  CaretDownIcon,
  CaretUpDownIcon,
  CaretUpIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"

interface SortableHeaderProps {
  label: string
  column: {
    getIsSorted: () => false | "asc" | "desc"
    toggleSorting: (desc?: boolean) => void
  }
}

/** A column header that toggles asc → desc → none. */
export function SortableHeader({ label, column }: SortableHeaderProps) {
  const sorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-7"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <CaretUpIcon data-icon="inline-end" />
      ) : sorted === "desc" ? (
        <CaretDownIcon data-icon="inline-end" />
      ) : (
        <CaretUpDownIcon data-icon="inline-end" className="opacity-40" />
      )}
    </Button>
  )
}
