import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(50),
  type: z.enum(["income", "expense"]),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid HEX color format."),
  icon: z.string().trim().min(1, "Icon identifier is required."),
});

export const createTransactionSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID."),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal number.")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than zero."),
  type: z.enum(["income", "expense"]),
  paymentMethod: z.enum(["cash", "card", "e_wallet"]),
  notes: z.string().max(255).optional().nullable(),
  transactionDate: z
    .string()
    .datetime({ message: "Invalid ISO date timestamp." }),
});

export const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().uuid("Invalid transaction ID."),
});

export const upsertBudgetSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID.").optional().nullable(),
  monthlyLimit: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Limit must be a valid decimal number.")
    .refine((val) => parseFloat(val) > 0, "Limit must be greater than zero."),
  alertThresholdPercent: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(80),
  monthYear: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Format must be YYYY-MM."),
});

export const getTransactionsFilterSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  categoryId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
export type GetTransactionsFilter = z.infer<typeof getTransactionsFilterSchema>;
