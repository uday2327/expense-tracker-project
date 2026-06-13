import type { Request, Response } from "express";
import { Currency, SplitType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { createExpenseWithSplits } from "../services/expense.service.js";
import { isoDateSchema, parseIsoDate } from "../utils/date.js";

const splitSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive().optional(),
  percentage: z.number().positive().optional(),
  shares: z.number().int().positive().optional()
});

const createExpenseSchema = z.object({
  paidByUserId: z.string().uuid(),
  description: z.string().trim().min(1),
  totalAmount: z.number().positive(),
  currency: z.nativeEnum(Currency),
  splitType: z.nativeEnum(SplitType),
  expenseDate: isoDateSchema,
  splits: z.array(splitSchema).default([])
});

const updateExpenseSchema = z.object({
  description: z.string().trim().min(1)
});

export async function createExpense(req: Request, res: Response) {
  const groupId = z.string().uuid().parse(req.params.groupId);
  const body = createExpenseSchema.parse(req.body);

  try {
    const expense = await createExpenseWithSplits({
      ...body,
      groupId,
      expenseDate: parseIsoDate(body.expenseDate)
    });

    return res.status(201).json({ expense });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Could not create expense"
    });
  }
}

export async function listExpenses(req: Request, res: Response) {
  const groupId = z.string().uuid().parse(req.params.groupId);
  const expenses = await prisma.expense.findMany({
    where: {
      groupId,
      isDeleted: false
    },
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      splits: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }
    },
    orderBy: { expenseDate: "desc" }
  });

  return res.json({ expenses });
}

export async function updateExpense(req: Request, res: Response) {
  const id = z.string().uuid().parse(req.params.id);
  const body = updateExpenseSchema.parse(req.body);

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      description: body.description
    },
    include: { splits: true }
  });

  return res.json({ expense });
}

export async function deleteExpense(req: Request, res: Response) {
  const id = z.string().uuid().parse(req.params.id);
  const expense = await prisma.expense.update({
    where: { id },
    data: { isDeleted: true }
  });

  return res.json({ expense });
}
