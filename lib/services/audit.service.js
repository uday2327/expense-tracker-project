import { prisma } from "@/lib/db";

export async function writeAuditLog({ action, actorUserId, groupId, entityType, entityId, metadata = {} }, client = prisma) {
  return client.auditLog.create({
    data: {
      action,
      actorUserId: actorUserId || null,
      groupId: groupId || null,
      entityType,
      entityId: entityId || null,
      metadata
    }
  });
}
