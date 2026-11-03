import { describe, expect, it } from "vitest"

import { formatMoney, sumMoney } from "@/lib/format/money"

describe("formatMoney", () => {
  it("formats numeric strings from PostgreSQL NUMERIC columns", () => {
    expect(formatMoney("29.00", "USD")).toBe("$29.00")
  })

  it("formats numbers", () => {
    expect(formatMoney(4.5, "USD")).toBe("$4.50")
  })

  it("returns a dash for null, undefined, and empty values", () => {
    expect(formatMoney(null)).toBe("—")
    expect(formatMoney(undefined)).toBe("—")
    expect(formatMoney("")).toBe("—")
  })

  it("returns a dash for non-numeric strings", () => {
    expect(formatMoney("not-a-number")).toBe("—")
  })
})

describe("sumMoney", () => {
  it("sums mixed numbers and numeric strings", () => {
    expect(sumMoney(["1.25", 2, null, undefined, "0.75"])).toBe(4)
  })

  it("ignores invalid values", () => {
    expect(sumMoney(["2.00", "oops"])).toBe(2)
  })
})
