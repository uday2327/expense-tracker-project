import { prisma } from "@/lib/db";
import { parseIsoDate } from "@/lib/dates";

export const USD_TO_INR_RATE = 83;

export function toInr(amount, currency) {
  return currency === "USD" ? Number(amount) * USD_TO_INR_RATE : Number(amount);
}

export async function getExchangeRate({ fromCurrency, toCurrency = "INR", effectiveOn }) {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const rate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency,
      toCurrency,
      effectiveOn: { lte: typeof effectiveOn === "string" ? parseIsoDate(effectiveOn) : effectiveOn }
    },
    orderBy: { effectiveOn: "desc" }
  });

  return rate ? Number(rate.rate) : USD_TO_INR_RATE;
}
