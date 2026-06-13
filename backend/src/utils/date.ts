import { z } from "zod";

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Use date format YYYY-MM-DD"
});

export function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

