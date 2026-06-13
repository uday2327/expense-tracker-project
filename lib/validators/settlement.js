import { z } from "zod";

export const createSettlementSchema = z.object({
  groupId: z.string().uuid(),
  paidByUserId: z.string().uuid(),
  paidToUserId: z.string().uuid(),
  amount: z.number().positive(),
  settledAt: z.string().datetime().optional()
});

