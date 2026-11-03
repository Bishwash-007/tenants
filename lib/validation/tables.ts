import { z } from "zod"

const optionalSeats = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce
    .number({ error: "Seats must be a number" })
    .int("Seats must be a whole number")
    .min(1, "Use at least 1 seat")
    .max(100, "Use at most 100 seats")
    .optional()
)

export const createTableSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Table label is required")
    .max(50, "Use 50 characters or fewer"),
  seats: optionalSeats,
})

export type CreateTableValues = z.infer<typeof createTableSchema>
