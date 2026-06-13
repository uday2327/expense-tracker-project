import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db";
import { appError } from "@/lib/errors";
import { formatIsoDate, parseIsoDate } from "@/lib/dates";
import { createExpense } from "@/lib/services/expense.service";
import { writeAuditLog } from "@/lib/services/audit.service";

const supportedCurrencies = new Set(["INR", "USD"]);

function normalizeName(name, memberNameMap, anomalies, rowNumber, rawData, fieldName) {
  if (!name) {
    anomalies.push(anomaly(rowNumber, rawData, "MISSING_FIELD", `${fieldName} is missing`, "REJECT_ROW"));
    return null;
  }

  const member = memberNameMap.get(String(name).trim().toLowerCase());
  if (!member) {
    anomalies.push(anomaly(rowNumber, rawData, "UNKNOWN_MEMBER", `${fieldName} '${name}' is not in this group`, "REJECT_ROW"));
    return null;
  }

  if (member.user.name !== String(name).trim()) {
    anomalies.push(anomaly(rowNumber, rawData, "NAME_MISMATCH", `${name} normalized to ${member.user.name}`, "NORMALIZE_NAME"));
  }

  return member;
}

function anomaly(rowNumber, rawData, anomalyType, anomalyDescription, actionTaken) {
  return { rowNumber, rawData, anomalyType, anomalyDescription, actionTaken };
}

function normalizeDate(value, rowNumber, rawData, anomalies) {
  if (!value) {
    anomalies.push(anomaly(rowNumber, rawData, "MISSING_FIELD", "date is missing", "REJECT_ROW"));
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    anomalies.push(anomaly(rowNumber, rawData, "MISSING_FIELD", "date is invalid", "REJECT_ROW"));
    return null;
  }

  const normalized = formatIsoDate(parsed);
  anomalies.push(anomaly(rowNumber, rawData, "INCONSISTENT_DATE_FORMAT", `${value} normalized to ${normalized}`, "NORMALIZE_DATE"));
  return normalized;
}

function looksLikeSettlement(description) {
  return /\b(paid|settled|sent|transfer|reimburse)\b/i.test(description || "");
}

function splitParticipants(row) {
  const value = row.participants || row.split_between || row.members || "";
  return String(value)
    .split(/[|,;]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

async function memberStatus(groupId, userName, expenseDate) {
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      user: { name: userName },
      joinedAt: { lte: parseIsoDate(expenseDate) }
    },
    include: { user: true },
    orderBy: { joinedAt: "desc" }
  });

  if (!membership) {
    return "NOT_JOINED";
  }

  if (membership.leftAt && membership.leftAt < parseIsoDate(expenseDate)) {
    return "LEFT";
  }

  return "ACTIVE";
}

async function loadGroupMemberNameMap(groupId) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } }
      }
    }
  });

  if (!group) {
    throw appError("Group not found", 404);
  }

  return new Map(group.members.map((member) => [member.user.name.toLowerCase(), member]));
}

async function hasExistingExpense({ groupId, description, expenseDate, totalAmount }) {
  const existing = await prisma.expense.findFirst({
    where: {
      groupId,
      description,
      expenseDate: parseIsoDate(expenseDate),
      totalAmount,
      isDeleted: false
    }
  });

  return Boolean(existing);
}

export async function createImportReview({ fileText, filename, groupId, uploadedByUserId }) {
  const rows = parse(fileText, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const memberNameMap = await loadGroupMemberNameMap(groupId);
  const anomalies = [];
  const stagedRows = [];
  const exactRowKeys = new Set();
  const expenseKeys = new Map();

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const rawData = row;
    const description = row.description || row.item || row.title || "";
    const date = normalizeDate(row.date || row.expense_date, rowNumber, rawData, anomalies);
    const amount = Number(row.amount || row.total_amount);
    const currency = String(row.currency || "INR").toUpperCase();
    const payerMember = normalizeName(row.paid_by || row.payer || row.paidBy, memberNameMap, anomalies, rowNumber, rawData, "payer");

    const rowKey = JSON.stringify(row);
    if (exactRowKeys.has(rowKey)) {
      anomalies.push(anomaly(rowNumber, rawData, "DUPLICATE_ROW", "Exact duplicate row found", "SKIP_DUPLICATE_REQUIRE_MEERA_APPROVAL"));
      continue;
    }
    exactRowKeys.add(rowKey);

    if (!supportedCurrencies.has(currency)) {
      anomalies.push(anomaly(rowNumber, rawData, "CURRENCY_MISMATCH", `${currency} is not supported`, "REJECT_ROW"));
      continue;
    }

    if (!date || !payerMember || !description || Number.isNaN(amount)) {
      anomalies.push(anomaly(rowNumber, rawData, "MISSING_FIELD", "date, amount, payer, and description are required", "REJECT_ROW"));
      continue;
    }

    const expenseKey = `${description.toLowerCase()}|${date}|${amount}`;
    if (expenseKeys.has(expenseKey) && expenseKeys.get(expenseKey) !== payerMember.user.name) {
      anomalies.push(anomaly(rowNumber, rawData, "DUPLICATE_EXPENSE", "Same description, date, and amount by different people", "REVIEW_CHOOSE_ONE"));
    }
    expenseKeys.set(expenseKey, payerMember.user.name);

    if (await hasExistingExpense({ groupId, description, expenseDate: date, totalAmount: amount })) {
      anomalies.push(anomaly(rowNumber, rawData, "DUPLICATE_EXPENSE", "Expense already exists in this group", "REJECT_ROW"));
      continue;
    }

    if (looksLikeSettlement(description)) {
      anomalies.push(anomaly(rowNumber, rawData, "SETTLEMENT_AS_EXPENSE", "Row looks like a payment between people", "RECLASSIFY_AS_SETTLEMENT"));
      continue;
    }

    if (currency === "USD") {
      anomalies.push(anomaly(rowNumber, rawData, "CURRENCY_MISMATCH", "USD amount converted with static 1 USD = 83 INR", "CONVERT_TO_INR"));
    }

    if (amount < 0) {
      anomalies.push(anomaly(rowNumber, rawData, "NEGATIVE_AMOUNT", "Negative amount treated as refund", "IMPORT_AS_REFUND_REQUIRE_CONFIRMATION"));
    }

    const participantNames = splitParticipants(row);
    const normalizedParticipants = participantNames
      .map((name) => normalizeName(name, memberNameMap, anomalies, rowNumber, rawData, "participant"))
      .filter(Boolean);

    for (const participant of normalizedParticipants) {
      const status = await memberStatus(groupId, participant.user.name, date);
      if (status === "LEFT") {
        anomalies.push(anomaly(rowNumber, rawData, "MEMBER_LEFT", `${participant.user.name} had left before this expense`, "EXCLUDE_FROM_SPLIT"));
      }
      if (status === "NOT_JOINED") {
        anomalies.push(anomaly(rowNumber, rawData, "MEMBER_NOT_YET_JOINED", `${participant.user.name} had not joined yet`, "EXCLUDE_FROM_SPLIT"));
      }
    }

    const splitType = (row.split_type || "EQUAL").toUpperCase();
    if (!row.split_type) {
      anomalies.push(anomaly(rowNumber, rawData, "MISSING_FIELD", "split_type missing; defaulting to EQUAL after confirmation", "DEFAULT_EQUAL_ON_CONFIRM"));
    }

    if (row.percentages) {
      const percentageTotal = String(row.percentages)
        .split(/[|,;]/)
        .reduce((total, value) => total + Number(value), 0);
      if (percentageTotal !== 100) {
        anomalies.push(anomaly(rowNumber, rawData, "SPLIT_DOESNT_ADD_UP", "Percentages do not sum to 100", "REJECT_ROW"));
        continue;
      }
    }

    stagedRows.push({
      rowNumber,
      description,
      totalAmount: amount,
      currency,
      paidByUserId: payerMember.userId,
      splitType: ["EQUAL", "EXACT", "PERCENTAGE", "SHARES"].includes(splitType) ? splitType : "EQUAL",
      expenseDate: date,
      splits: []
    });
  }

  const session = await prisma.importSession.create({
    data: {
      filename,
      groupId,
      uploadedByUserId,
      stagedData: stagedRows,
      anomalies: {
        createMany: {
          data: anomalies.map((item) => ({
            rowNumber: item.rowNumber,
            rawData: item.rawData,
            anomalyType: item.anomalyType,
            anomalyDescription: item.anomalyDescription,
            actionTaken: item.actionTaken
          }))
        }
      }
    },
    include: { anomalies: true }
  });

  await writeAuditLog({
    action: "CREATE_IMPORT_SESSION",
    actorUserId: uploadedByUserId,
    groupId,
    entityType: "ImportSession",
    entityId: session.id,
    metadata: { filename, stagedRowCount: stagedRows.length, anomalyCount: session.anomalies.length }
  });

  return { session, stagedRows, anomalies: session.anomalies };
}

export async function confirmImport({ sessionId, groupId, approvedByUserId }) {
  const session = await prisma.importSession.findUnique({
    where: { id: sessionId },
    include: { anomalies: true }
  });

  if (!session) {
    throw appError("Import session not found", 404);
  }

  if (session.status !== "PENDING_REVIEW") {
    throw appError(`Import session is already ${session.status.toLowerCase()}`);
  }

  if (session.groupId && session.groupId !== groupId) {
    throw appError("Import session does not belong to this group");
  }

  return prisma.$transaction(async (tx) => {
    const importedExpenses = [];
    for (const row of session.stagedData) {
      const expense = await createExpense(
        {
          ...row,
          groupId,
          expenseDate: parseIsoDate(row.expenseDate),
          isFlaggedAnomaly: session.anomalies.some((item) => item.rowNumber === row.rowNumber),
          anomalyReason: session.anomalies
            .filter((item) => item.rowNumber === row.rowNumber)
            .map((item) => item.anomalyType)
            .join(", ")
        },
        tx
      );
      importedExpenses.push(expense);
    }

    await tx.importAnomaly.updateMany({
      where: { importSessionId: sessionId },
      data: { approvedByUserId, approvedAt: new Date() }
    });

    const updatedSession = await tx.importSession.update({
      where: { id: sessionId },
      data: {
        status: "CONFIRMED",
        groupId,
        confirmedByUserId: approvedByUserId,
        confirmedAt: new Date()
      },
      include: { anomalies: true }
    });

    await writeAuditLog(
      {
        action: "CONFIRM_IMPORT",
        actorUserId: approvedByUserId,
        groupId,
        entityType: "ImportSession",
        entityId: sessionId,
        metadata: { importedExpenseCount: importedExpenses.length, anomalyCount: session.anomalies.length }
      },
      tx
    );

    return { session: updatedSession, importedExpenses };
  });
}

export async function rejectImport({ sessionId, rejectedByUserId, reason }) {
  const session = await prisma.importSession.findUnique({
    where: { id: sessionId },
    include: { anomalies: true }
  });

  if (!session) {
    throw appError("Import session not found", 404);
  }

  if (session.status !== "PENDING_REVIEW") {
    throw appError(`Import session is already ${session.status.toLowerCase()}`);
  }

  return prisma.$transaction(async (tx) => {
    const updatedSession = await tx.importSession.update({
      where: { id: sessionId },
      data: {
        status: "REJECTED",
        rejectedByUserId,
        rejectedAt: new Date(),
        rejectionReason: reason || null
      },
      include: { anomalies: true }
    });

    await writeAuditLog(
      {
        action: "REJECT_IMPORT",
        actorUserId: rejectedByUserId,
        groupId: session.groupId,
        entityType: "ImportSession",
        entityId: sessionId,
        metadata: { reason: reason || null, anomalyCount: session.anomalies.length }
      },
      tx
    );

    return { session: updatedSession };
  });
}
