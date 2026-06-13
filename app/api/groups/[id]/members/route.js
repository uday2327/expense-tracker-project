import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseIsoDate } from "@/lib/dates";
import { handleApiError, json } from "@/lib/http";
import { getActiveMembers } from "@/lib/services/membership.service";
import { addMemberSchema, memberQuerySchema, removeMemberSchema } from "@/lib/validators/group";

export async function GET(request, { params }) {
  try {
    requireUser(request);
    const groupId = z.string().uuid().parse((await params).id);
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
    requireUser(request);
    const groupId = z.string().uuid().parse((await params).id);
    const body = addMemberSchema.parse(await request.json());
    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId: body.userId,
        joinedAt: parseIsoDate(body.joinedAt)
      },
      include: { user: true }
    });

    return json({ member }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    requireUser(request);
    const groupId = z.string().uuid().parse((await params).id);
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

    return json({ member });
  } catch (error) {
    return handleApiError(error);
  }
}

