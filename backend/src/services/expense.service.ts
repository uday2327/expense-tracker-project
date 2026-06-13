import type { Currency, SplitType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { getActiveMembers } from "./membership.service.js";
import { toInr } from "./currency.service.js";
import { splitEvenly, sumMoney } from "../utils/money.js";

type SplitInput = {
  userId: string;
  amount?: number;
  percentage?: number;
  shares?: number;
};

type CreateExpenseInput = {
  groupId: string;
  paidByUserId: string;
  description: string;
  totalAmount: number;
  currency: Currency;
  splitType: SplitType;
  expenseDate: Date;
  splits: SplitInput[];
};

type CalculatedSplit = {
  userId: string;
  amountOwed: number;
};

function assertActiveParticipant(userId: string, activeUserIds: Set<string>) {
  if (!activeUserIds.has(userId)) {
    throw new Error(`User ${userId} was not a group member on the expense date`);
  }
}

function calculateEqualSplits(activeUserIds: string[], amountInInr: number) {
  const amounts = splitEvenly(amountInInr, activeUserIds.length);
  return activeUserIds.map((userId, index) => ({
    userId,
    amountOwed: amounts[index]
  }));
}

function calculateExactSplits(
  splits: SplitInput[],
  currency: Currency,
  amountInInr: number,
  activeUserIds: Set<string>
) {
  const calculated = splits.map((split) => {
    assertActiveParticipant(split.userId, activeUserIds);

    if (split.amount === undefined) {
      throw new Error("Exact splits require amount for every participant");
    }

    return {
      userId: split.userId,
      amountOwed: toInr(split.amount, currency)
    };
  });

  if (sumMoney(calculated.map((split) => split.amountOwed)) !== sumMoney([amountInInr])) {
    throw new Error("Exact splits must add up to the expense total");
  }

  return calculated;
}

function calculatePercentageSplits(
  splits: SplitInput[],
  amountInInr: number,
  activeUserIds: Set<string>
) {
  const totalPercentage = splits.reduce(
    (total, split) => total + (split.percentage ?? 0),
    0
  );

  if (Math.round(totalPercentage * 100) !== 10000) {
    throw new Error("Percentage splits must add up to 100");
  }

  const calculated = splits.map((split) => {
    assertActiveParticipant(split.userId, activeUserIds);

    if (split.percentage === undefined) {
      throw new Error("Percentage splits require percentage for every participant");
    }

    return {
      userId: split.userId,
      amountOwed: Number(((amountInInr * split.percentage) / 100).toFixed(2))
    };
  });

  const difference = sumMoney([amountInInr]) - sumMoney(calculated.map((split) => split.amountOwed));
  calculated[0].amountOwed = sumMoney([calculated[0].amountOwed, difference]);

  return calculated;
}

function calculateShareSplits(
  splits: SplitInput[],
  amountInInr: number,
  activeUserIds: Set<string>
) {
  const totalShares = splits.reduce((total, split) => total + (split.shares ?? 0), 0);

  if (totalShares <= 0) {
    throw new Error("Share splits require at least one share");
  }

  const calculated = splits.map((split) => {
    assertActiveParticipant(split.userId, activeUserIds);

    if (split.shares === undefined || split.shares <= 0) {
      throw new Error("Share splits require a positive share count");
    }

    return {
      userId: split.userId,
      amountOwed: Number(((amountInInr * split.shares) / totalShares).toFixed(2))
    };
  });

  const difference = sumMoney([amountInInr]) - sumMoney(calculated.map((split) => split.amountOwed));
  calculated[0].amountOwed = sumMoney([calculated[0].amountOwed, difference]);

  return calculated;
}

async function calculateSplits(input: CreateExpenseInput): Promise<CalculatedSplit[]> {
  const activeMembers = await getActiveMembers(input.groupId, input.expenseDate);
  const activeUserIds = activeMembers.map((member) => member.userId);
  const activeUserIdSet = new Set(activeUserIds);

  if (activeUserIds.length === 0) {
    throw new Error("No active members found on the expense date");
  }

  assertActiveParticipant(input.paidByUserId, activeUserIdSet);

  const amountInInr = toInr(input.totalAmount, input.currency);

  if (input.splitType === "EQUAL") {
    return calculateEqualSplits(activeUserIds, amountInInr);
  }

  if (input.splits.length === 0) {
    throw new Error(`${input.splitType} splits require split details`);
  }

  if (input.splitType === "EXACT") {
    return calculateExactSplits(input.splits, input.currency, amountInInr, activeUserIdSet);
  }

  if (input.splitType === "PERCENTAGE") {
    return calculatePercentageSplits(input.splits, amountInInr, activeUserIdSet);
  }

  return calculateShareSplits(input.splits, amountInInr, activeUserIdSet);
}

export async function createExpenseWithSplits(input: CreateExpenseInput) {
  const amountInInr = toInr(input.totalAmount, input.currency);
  const splits = await calculateSplits(input);

  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        groupId: input.groupId,
        paidByUserId: input.paidByUserId,
        description: input.description,
        totalAmount: input.totalAmount,
        currency: input.currency,
        amountInInr,
        splitType: input.splitType,
        expenseDate: input.expenseDate,
        splits: {
          createMany: {
            data: splits.map((split) => ({
              userId: split.userId,
              amountOwed: split.amountOwed
            }))
          }
        }
      },
      include: { splits: true }
    });

    return expense;
  });
}

