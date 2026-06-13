import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export function activeMembershipWhere(groupId: string, at: Date) {
  return {
    groupId,
    joinedAt: { lte: at },
    OR: [{ leftAt: null }, { leftAt: { gte: at } }]
  } satisfies Prisma.GroupMemberWhereInput;
}

export async function getActiveMembers(groupId: string, at: Date) {
  return prisma.groupMember.findMany({
    where: activeMembershipWhere(groupId, at),
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      user: {
        name: "asc"
      }
    }
  });
}

