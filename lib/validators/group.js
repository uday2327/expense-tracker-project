import { z } from "zod";
import { isoDateSchema } from "@/lib/dates";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1)
});

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  joinedAt: isoDateSchema
});

export const removeMemberSchema = z.object({
  leftAt: isoDateSchema
});

export const memberQuerySchema = z.object({
  at: isoDateSchema
});

