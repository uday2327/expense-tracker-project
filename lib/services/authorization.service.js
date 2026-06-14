import { prisma } from "@/lib/db";
import { appError } from "@/lib/errors";

export async function hasGroupAccess(userId, groupId, client = prisma) {
  if (!userId || !groupId) {
    return false;
  }

  const membership = await client.groupMember.findFirst({
    where: { userId, groupId },
    select: { id: true }
  });

  return Boolean(membership);
}

export async function assertGroupAccess(userId, groupId, client = prisma) {
  if (!(await hasGroupAccess(userId, groupId, client))) {
    throw appError("You do not have access to this group", 403);
  }
}
