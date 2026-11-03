export function formatMoney(
  value: string | number | null | undefined,
  currency = "USD",
  locale = "en-US"
): string {
  if (value === null || value === undefined || value === "") {
    return "—"
  }

  const amount = typeof value === "string" ? Number(value) : value

  if (!Number.isFinite(amount)) {
    return "—"
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount)
}

export function sumMoney(
  values: Array<string | number | null | undefined>
): number {
  return values.reduce<number>((total, value) => {
    if (value === null || value === undefined || value === "") {
      return total
    }

    const amount = typeof value === "string" ? Number(value) : value
    return Number.isFinite(amount) ? total + amount : total
  }, 0)
}
