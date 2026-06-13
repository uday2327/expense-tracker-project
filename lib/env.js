import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16)
});

export function getEnv() {
  return envSchema.parse(process.env);
}
