import { describe, expect, it } from "vitest"

import {
  TRANSITIONS,
  formatAge,
  normalizeOrderStatus,
  orderTypeLabel,
  statusLabel,
  statusSortRank,
  statusVariant,
} from "@/lib/kds/types"

describe("normalizeOrderStatus", () => {
  it("keeps canonical lifecycle statuses", () => {
    expect(normalizeOrderStatus("placed")).toBe("placed")
    expect(normalizeOrderStatus("awaiting_payment")).toBe("awaiting_payment")
    expect(normalizeOrderStatus("completed")).toBe("completed")
  })

  it("maps the legacy `serving` seed value onto `served`", () => {
    expect(normalizeOrderStatus("serving")).toBe("served")
  })

  it("returns null for values outside the lifecycle", () => {
    expect(normalizeOrderStatus("refunded")).toBeNull()
  })
})

describe("status helpers", () => {
  it("falls back to the raw value for an unknown status", () => {
    expect(statusLabel("refunded")).toBe("refunded")
    expect(statusVariant("refunded")).toBe("outline")
  })

  it("ranks unknown statuses after every known one", () => {
    expect(statusSortRank("refunded")).toBeGreaterThan(
      statusSortRank("cancelled")
    )
  })
})

describe("formatAge", () => {
  const now = new Date("2026-01-01T12:00:00.000Z").getTime()

  it("renders seconds, minutes, and hours", () => {
    expect(formatAge("2026-01-01T11:59:30.000Z", now)).toBe("30s ago")
    expect(formatAge("2026-01-01T11:45:00.000Z", now)).toBe("15m ago")
    expect(formatAge("2026-01-01T09:00:00.000Z", now)).toBe("3h ago")
  })

  it("returns a dash for an unparseable timestamp", () => {
    expect(formatAge("not-a-date", now)).toBe("—")
  })
})

describe("TRANSITIONS", () => {
  it("terminates completed and cancelled orders", () => {
    expect(TRANSITIONS.completed).toEqual([])
    expect(TRANSITIONS.cancelled).toEqual([])
  })

  it("lets every pre-payment status cancel", () => {
    for (const status of [
      "placed",
      "confirmed",
      "preparing",
      "ready",
      "served",
      "awaiting_payment",
    ] as const) {
      expect(TRANSITIONS[status]).toContain("cancelled")
    }
  })
})

describe("orderTypeLabel", () => {
  it("humanizes known order types and passes unknown ones through", () => {
    expect(orderTypeLabel("dine_in")).toBe("Dine in")
    expect(orderTypeLabel("takeaway")).toBe("Takeaway")
    expect(orderTypeLabel("dine-in")).toBe("dine-in")
  })
})
