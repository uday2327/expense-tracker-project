import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseIsoDate } from "@/lib/dates";
import { handleApiError, json } from "@/lib/http";
import { createExpense } from "@/lib/services/expense.service";
import { createExpenseSchema } from "@/lib/validators/expense";

export async function GET(request, { params }) {
  try {
    requireUser(request);
    const groupId = z.string().uuid().parse((await params).id);
    const expenses = await prisma.expense.findMany({
      where: { groupId, isDeleted: false },
      include: {
        paidBy: { select: { id: true, name: true, email: true } },
        splits: { include: { user: { select: { id: true, name: true, email: true } } } }
      },
      orderBy: { expenseDate: "desc" }
    });

    return json({ expenses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request, { params }) {
  try {
    requireUser(request);
    const groupId = z.string().uuid().parse((await params).id);
    const body = createExpenseSchema.parse(await request.json());
    const expense = await createExpense({
      ...body,
      groupId,
      expenseDate: parseIsoDate(body.expenseDate)
    });

    return json({ expense }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
