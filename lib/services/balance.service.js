import { prisma } from "@/lib/db";
import { fromPaise, toPaise } from "@/lib/money";
import { activeMembershipWhere } from "@/lib/services/membership.service";

export async function getBalanceSummary(groupId) {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  const balances = new Map(
    members.map((member) => [
      member.userId,
      {
        user: member.user,
        paidPaise: 0,
        owedPaise: 0,
        settlementPaidPaise: 0,
        settlementReceivedPaise: 0,
        expenses: []
      }
    ])
  );

  const expenses = await prisma.expense.findMany({
    where: { groupId, isDeleted: false },
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      splits: { include: { user: { select: { id: true, name: true, email: true } } } }
    }
  });

  for (const expense of expenses) {
    const active = await prisma.groupMember.findMany({
      where: activeMembershipWhere(groupId, expense.expenseDate)
    });
    const activeUserIds = new Set(active.map((member) => member.userId));

    if (activeUserIds.has(expense.paidByUserId)) {
      const payerBalance = balances.get(expense.paidByUserId);
      payerBalance.paidPaise += toPaise(expense.amountInInr);
      payerBalance.expenses.push(expense);
    }

    for (const split of expense.splits) {
      if (!activeUserIds.has(split.userId)) {
        continue;
      }

      const userBalance = balances.get(split.userId);
      if (userBalance) {
        userBalance.owedPaise += toPaise(split.amountOwed);
        userBalance.expenses.push(expense);
      }
    }
  }

  const settlements = await prisma.settlement.findMany({
    where: { groupId },
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      paidTo: { select: { id: true, name: true, email: true } }
    }
  });

  for (const settlement of settlements) {
    balances.get(settlement.paidByUserId).settlementPaidPaise += toPaise(settlement.amount);
    balances.get(settlement.paidToUserId).settlementReceivedPaise += toPaise(settlement.amount);
  }

  const summary = [...balances.values()].map((balance) => {
    const netPaise =
      balance.paidPaise -
      balance.owedPaise +
      balance.settlementPaidPaise -
      balance.settlementReceivedPaise;

    return {
      user: balance.user,
      paid: fromPaise(balance.paidPaise),
      owed: fromPaise(balance.owedPaise),
      settlementPaid: fromPaise(balance.settlementPaidPaise),
      settlementReceived: fromPaise(balance.settlementReceivedPaise),
      netBalance: fromPaise(netPaise),
      drilldown: balance.expenses
    };
  });

  return {
    summary,
    simplifiedDebts: simplifyDebts(summary),
    settlements
  };
}

export function simplifyDebts(summary) {
  const debtors = summary
    .filter((item) => item.netBalance < 0)
    .map((item) => ({ user: item.user, amountPaise: Math.abs(toPaise(item.netBalance)) }))
    .sort((a, b) => b.amountPaise - a.amountPaise);

  const creditors = summary
    .filter((item) => item.netBalance > 0)
    .map((item) => ({ user: item.user, amountPaise: toPaise(item.netBalance) }))
    .sort((a, b) => b.amountPaise - a.amountPaise);

  const debts = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountPaise = Math.min(debtor.amountPaise, creditor.amountPaise);

    debts.push({
      from: debtor.user,
      to: creditor.user,
      amount: fromPaise(amountPaise)
    });

    debtor.amountPaise -= amountPaise;
    creditor.amountPaise -= amountPaise;

    if (debtor.amountPaise === 0) debtorIndex += 1;
    if (creditor.amountPaise === 0) creditorIndex += 1;
  }

  return debts;
}

