import { z } from "zod"

export const createShiftSchema = z
  .object({
    userId: z.string().uuid("Enter a valid user id"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  })

export const updateShiftSchema = z.object({
  userId: z.string().uuid("Enter a valid user id").optional(),
  startTime: z.string().min(1, "Start time is required").optional(),
  endTime: z.string().min(1, "End time is required").optional(),
})

export const wageRateSchema = z.object({
  payType: z.string().min(1),
  rate: z.coerce.number().min(0),
})
