import { prisma } from "@/lib/db";

export function activeMembershipWhere(groupId, at) {
  return {
    groupId,
    joinedAt: { lte: at },
    OR: [{ leftAt: null }, { leftAt: { gte: at } }]
  };
}

export async function getActiveMembers(groupId, at) {
  return prisma.groupMember.findMany({
    where: activeMembershipWhere(groupId, at),
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { user: { name: "asc" } }
  });
}

export function isActiveUser(members, userId) {
  return members.some((member) => member.userId === userId);
}

