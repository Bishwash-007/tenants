import { z } from "zod"

export const createOrderSchema = z.object({
  branchId: z.string().uuid("Invalid branch"),
  tableId: z.string().uuid("Invalid table").nullable().optional(),
  customerId: z.string().uuid("Invalid customer").nullable().optional(),
  orderType: z.enum(["dine_in", "takeaway", "delivery"]).optional(),
  clientActionId: z.string().max(150).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid("Invalid menu item"),
        quantity: z.coerce.number().int().min(1).max(100).default(1),
        notes: z.string().max(1000).nullable().optional(),
        modifiers: z
          .array(
            z.object({
              name: z.string().max(100),
              optionName: z.string().max(100),
              modifierId: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .min(1, "At least one item required"),
})

export const transitionOrderSchema = z.object({
  status: z.string().min(1, "Status is required"),
})

export type CreateOrderValues = z.infer<typeof createOrderSchema>
export type TransitionOrderValues = z.infer<typeof transitionOrderSchema>
