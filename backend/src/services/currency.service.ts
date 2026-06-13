import type { Currency } from "@prisma/client";

export const USD_TO_INR_RATE = 83;

export function toInr(amount: number, currency: Currency) {
  return currency === "USD" ? amount * USD_TO_INR_RATE : amount;
}

