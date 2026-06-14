import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseIsoDate } from "@/lib/dates";
import { handleApiError, json } from "@/lib/http";
import { appError } from "@/lib/errors";
import { assertGroupAccess } from "@/lib/services/authorization.service";
import { writeAuditLog } from "@/lib/services/audit.service";
import { getActiveMembers } from "@/lib/services/membership.service";
import { addMemberSchema, memberQuerySchema, removeMemberSchema } from "@/lib/validators/group";

export async function GET(request, { params }) {
  try {
    const user = requireUser(request);
    const groupId = z.string().uuid().parse((await params).id);
    await assertGroupAccess(user.id, groupId);
    const query = memberQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );
    const members = await getActiveMembers(groupId, parseIsoDate(query.at));

    return json({ groupId, at: query.at, members });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const user = requireUser(request);
    const groupId = z.string().uuid().parse((await params).id);
    await assertGroupAccess(user.id, groupId);
    const body = addMemberSchema.parse(await request.json());

    const member = await prisma.$transaction(async (tx) => {
      let memberUser;
      if (body.userId) {
        memberUser = await tx.user.findUnique({ where: { id: body.userId } });
        if (!memberUser) {
          throw appError("User not found", 404);
        }
      } else {
        const email = body.email || `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}.${randomUUID().slice(0, 8)}@flowledger.local`;
        memberUser = await tx.user.findUnique({ where: { email } });
        if (!memberUser) {
          memberUser = await tx.user.create({
            data: {
              name: body.name,
              email,
              passwordHash: await bcrypt.hash(randomUUID(), 10)
            }
          });
        }
      }

      const activeMembership = await tx.groupMember.findFirst({
        where: { groupId, userId: memberUser.id, leftAt: null }
      });
      if (activeMembership) {
        throw appError(`${memberUser.name} is already active in this group`);
      }

      const createdMember = await tx.groupMember.create({
        data: {
          groupId,
          userId: memberUser.id,
          joinedAt: parseIsoDate(body.joinedAt)
        },
        include: { user: true }
      });

      await writeAuditLog(
        {
          action: "ADD_MEMBER",
          actorUserId: user.id,
          groupId,
          entityType: "GroupMember",
          entityId: createdMember.id,
          metadata: { userId: memberUser.id, name: memberUser.name, joinedAt: body.joinedAt }
        },
        tx
      );

      return createdMember;
    });

    return json({ member }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = requireUser(request);
    const groupId = z.string().uuid().parse((await params).id);
    await assertGroupAccess(user.id, groupId);
    const body = removeMemberSchema.parse(await request.json());
    const searchParams = new URL(request.url).searchParams;
    const userId = z.string().uuid().parse(searchParams.get("userId"));

    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId, leftAt: null },
      orderBy: { joinedAt: "desc" }
    });

    if (!membership) {
      return json({ message: "Active membership not found" }, 404);
    }

    const member = await prisma.groupMember.update({
      where: { id: membership.id },
      data: { leftAt: parseIsoDate(body.leftAt) },
      include: { user: true }
    });
    await writeAuditLog({
      action: "REMOVE_MEMBER",
      actorUserId: user.id,
      groupId,
      entityType: "GroupMember",
      entityId: member.id,
      metadata: { userId, leftAt: body.leftAt }
    });

    return json({ member });
  } catch (error) {
    return handleApiError(error);
  }
}
