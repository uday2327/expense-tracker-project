import { z } from "zod";
import { isoDateSchema } from "@/lib/dates";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1)
});

export const addMemberSchema = z.object({
  userId: z.string().uuid().optional(),
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  joinedAt: isoDateSchema
}).refine((data) => data.userId || data.name, {
  message: "Provide either an existing userId or a new member name",
  path: ["name"]
});

export const removeMemberSchema = z.object({
  leftAt: isoDateSchema
});

export const memberQuerySchema = z.object({
  at: isoDateSchema
});
