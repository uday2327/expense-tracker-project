import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { assertGroupAccess } from "@/lib/services/authorization.service";
import { writeAuditLog } from "@/lib/services/audit.service";
import { createSettlement } from "@/lib/services/settlement.service";
import { createSettlementSchema } from "@/lib/validators/settlement";

export async function POST(request) {
  try {
    const user = requireUser(request);
    const body = createSettlementSchema.parse(await request.json());
    await assertGroupAccess(user.id, body.groupId);
    const settlement = await createSettlement({
      ...body,
      settledAt: body.settledAt ? new Date(body.settledAt) : new Date()
    });
    await writeAuditLog({
      action: "CREATE_SETTLEMENT",
      actorUserId: user.id,
      groupId: body.groupId,
      entityType: "Settlement",
      entityId: settlement.id,
      metadata: { amount: String(settlement.amount), paidByUserId: body.paidByUserId, paidToUserId: body.paidToUserId }
    });

    return json({ settlement }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
