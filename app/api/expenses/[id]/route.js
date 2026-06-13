import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { updateExpenseSchema } from "@/lib/validators/expense";

export async function PATCH(request, { params }) {
  try {
    requireUser(request);
    const id = z.string().uuid().parse((await params).id);
    const body = updateExpenseSchema.parse(await request.json());
    const expense = await prisma.expense.update({
      where: { id },
      data: { description: body.description },
      include: { splits: true }
    });

    return json({ expense });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    requireUser(request);
    const id = z.string().uuid().parse((await params).id);
    const expense = await prisma.expense.update({
      where: { id },
      data: { isDeleted: true }
    });

    return json({ expense });
  } catch (error) {
    return handleApiError(error);
  }
}

