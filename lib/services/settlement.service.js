import { prisma } from "@/lib/db";

export async function createSettlement(data) {
  return prisma.settlement.create({
    data,
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      paidTo: { select: { id: true, name: true, email: true } }
    }
  });
}

