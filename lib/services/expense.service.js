import { prisma } from "@/lib/db";
import { appError } from "@/lib/errors";
import { splitEvenly, sumMoney } from "@/lib/money";
import { toInr } from "@/lib/services/currency.service";
import { getActiveMembers, isActiveUser } from "@/lib/services/membership.service";

function assertActiveParticipant(userId, activeUserIds) {
  if (!activeUserIds.has(userId)) {
    throw appError(`User ${userId} was not a group member on the expense date`);
  }
}

function calculateEqualSplits(activeUserIds, amountInInr) {
  const amounts = splitEvenly(amountInInr, activeUserIds.length);
  return activeUserIds.map((userId, index) => ({
    userId,
    amountOwed: amounts[index]
  }));
}

function calculateExactSplits({ splits, currency, amountInInr, activeUserIds }) {
  const calculated = splits.map((split) => {
    assertActiveParticipant(split.userId, activeUserIds);

    if (split.amount === undefined) {
      throw appError("Exact splits require amount for every participant");
    }

    return {
      userId: split.userId,
      amountOwed: toInr(split.amount, currency)
    };
  });

  if (sumMoney(calculated.map((split) => split.amountOwed)) !== sumMoney([amountInInr])) {
    throw appError("Exact splits must add up to the expense total");
  }

  return calculated;
}

function calculatePercentageSplits({ splits, amountInInr, activeUserIds }) {
  const totalPercentage = splits.reduce(
    (total, split) => total + (split.percentage || 0),
    0
  );

  if (Math.round(totalPercentage * 100) !== 10000) {
    throw appError("Percentage splits must add up to 100");
  }

  const calculated = splits.map((split) => {
    assertActiveParticipant(split.userId, activeUserIds);

    if (split.percentage === undefined) {
      throw appError("Percentage splits require percentage for every participant");
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

function calculateShareSplits({ splits, amountInInr, activeUserIds }) {
  const totalShares = splits.reduce((total, split) => total + (split.shares || 0), 0);

  if (totalShares <= 0) {
    throw appError("Share splits require at least one share");
  }

  const calculated = splits.map((split) => {
    assertActiveParticipant(split.userId, activeUserIds);

    if (!split.shares || split.shares <= 0) {
      throw appError("Share splits require a positive share count");
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

export async function calculateExpenseSplits(data) {
  const activeMembers = await getActiveMembers(data.groupId, data.expenseDate);
  const activeUserIds = activeMembers.map((member) => member.userId);
  const activeUserIdSet = new Set(activeUserIds);
  const amountInInr = toInr(data.totalAmount, data.currency);

  if (activeMembers.length === 0) {
    throw appError("No active members found on the expense date");
  }

  if (!isActiveUser(activeMembers, data.paidByUserId)) {
    throw appError("Payer was not a group member on the expense date");
  }

  if (data.splitType === "EQUAL") {
    return calculateEqualSplits(activeUserIds, amountInInr);
  }

  if (!data.splits?.length) {
    throw appError(`${data.splitType} splits require split details`);
  }

  if (data.splitType === "EXACT") {
    return calculateExactSplits({
      splits: data.splits,
      currency: data.currency,
      amountInInr,
      activeUserIds: activeUserIdSet
    });
  }

  if (data.splitType === "PERCENTAGE") {
    return calculatePercentageSplits({
      splits: data.splits,
      amountInInr,
      activeUserIds: activeUserIdSet
    });
  }

  return calculateShareSplits({
    splits: data.splits,
    amountInInr,
    activeUserIds: activeUserIdSet
  });
}

export async function createExpense(data, client = prisma) {
  const amountInInr = toInr(data.totalAmount, data.currency);
  const splits = await calculateExpenseSplits(data);

  return client.expense.create({
    data: {
      groupId: data.groupId,
      paidByUserId: data.paidByUserId,
      description: data.description,
      totalAmount: data.totalAmount,
      currency: data.currency,
      amountInInr,
      splitType: data.splitType,
      expenseDate: data.expenseDate,
      isFlaggedAnomaly: Boolean(data.isFlaggedAnomaly),
      anomalyReason: data.anomalyReason || null,
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
}
