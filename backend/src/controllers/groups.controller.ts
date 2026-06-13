import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { getActiveMembers } from "../services/membership.service.js";
import { isoDateSchema, parseIsoDate } from "../utils/date.js";

const createGroupSchema = z.object({
  name: z.string().trim().min(1)
});

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  joinedAt: isoDateSchema
});

const removeMemberSchema = z.object({
  leftAt: isoDateSchema
});

const memberQuerySchema = z.object({
  at: isoDateSchema
});

export async function createGroup(req: Request, res: Response) {
  const body = createGroupSchema.parse(req.body);
  const group = await prisma.group.create({
    data: { name: body.name }
  });

  return res.status(201).json({ group });
}

export async function addMember(req: Request, res: Response) {
  const groupId = z.string().uuid().parse(req.params.id);
  const body = addMemberSchema.parse(req.body);
  const joinedAt = parseIsoDate(body.joinedAt);

  const [group, user] = await Promise.all([
    prisma.group.findUnique({ where: { id: groupId } }),
    prisma.user.findUnique({ where: { id: body.userId } })
  ]);

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const member = await prisma.groupMember.create({
    data: {
      groupId,
      userId: body.userId,
      joinedAt
    },
    include: { user: true }
  });

  return res.status(201).json({ member });
}

export async function removeMember(req: Request, res: Response) {
  const groupId = z.string().uuid().parse(req.params.id);
  const userId = z.string().uuid().parse(req.params.userId);
  const body = removeMemberSchema.parse(req.body);
  const leftAt = parseIsoDate(body.leftAt);

  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId,
      leftAt: null
    },
    orderBy: {
      joinedAt: "desc"
    }
  });

  if (!membership) {
    return res.status(404).json({ message: "Active membership not found" });
  }

  if (leftAt < membership.joinedAt) {
    return res.status(400).json({
      message: "leftAt cannot be before joinedAt"
    });
  }

  const member = await prisma.groupMember.update({
    where: { id: membership.id },
    data: { leftAt },
    include: { user: true }
  });

  return res.json({ member });
}

export async function listMembersAtDate(req: Request, res: Response) {
  const groupId = z.string().uuid().parse(req.params.id);
  const query = memberQuerySchema.parse(req.query);
  const members = await getActiveMembers(groupId, parseIsoDate(query.at));

  return res.json({
    groupId,
    at: query.at,
    members: members.map((member) => ({
      id: member.id,
      user: member.user,
      joinedAt: member.joinedAt,
      leftAt: member.leftAt
    }))
  });
}

