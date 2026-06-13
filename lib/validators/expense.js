import { z } from "zod";
import { isoDateSchema } from "@/lib/dates";

export const splitSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive().optional(),
  percentage: z.number().positive().optional(),
  shares: z.number().int().positive().optional()
});

export const createExpenseSchema = z.object({
  paidByUserId: z.string().uuid(),
  description: z.string().trim().min(1),
  totalAmount: z.number(),
  currency: z.enum(["INR", "USD"]),
  splitType: z.enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"]).default("EQUAL"),
  expenseDate: isoDateSchema,
  splits: z.array(splitSchema).default([])
});

export const updateExpenseSchema = z.object({
  description: z.string().trim().min(1)
});

