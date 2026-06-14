import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { appError } from "@/lib/errors";
import { assertGroupAccess } from "@/lib/services/authorization.service";
import { writeAuditLog } from "@/lib/services/audit.service";
import { updateExpenseSchema } from "@/lib/validators/expense";

export async function PATCH(request, { params }) {
  try {
    const user = requireUser(request);
    const id = z.string().uuid().parse((await params).id);
    const body = updateExpenseSchema.parse(await request.json());
    const existingExpense = await prisma.expense.findUnique({ where: { id }, select: { groupId: true } });
    if (!existingExpense) {
      throw appError("Expense not found", 404);
    }
    await assertGroupAccess(user.id, existingExpense.groupId);

    const expense = await prisma.expense.update({
      where: { id },
      data: { description: body.description },
      include: { splits: true }
    });
    await writeAuditLog({
      action: "UPDATE_EXPENSE",
      actorUserId: user.id,
      groupId: existingExpense.groupId,
      entityType: "Expense",
      entityId: id,
      metadata: { description: body.description }
    });

    return json({ expense });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = requireUser(request);
    const id = z.string().uuid().parse((await params).id);
    const existingExpense = await prisma.expense.findUnique({ where: { id }, select: { groupId: true } });
    if (!existingExpense) {
      throw appError("Expense not found", 404);
    }
    await assertGroupAccess(user.id, existingExpense.groupId);

    const expense = await prisma.expense.update({
      where: { id },
      data: { isDeleted: true }
    });
    await writeAuditLog({
      action: "DELETE_EXPENSE",
      actorUserId: user.id,
      groupId: existingExpense.groupId,
      entityType: "Expense",
      entityId: id
    });

    return json({ expense });
  } catch (error) {
    return handleApiError(error);
  }
}
