import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { writeAuditLog } from "@/lib/services/audit.service";
import { createGroupSchema } from "@/lib/validators/group";

export async function GET(request) {
  try {
    const user = requireUser(request);
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: user.id } } },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: "desc" }
    });

    return json({ groups });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const user = requireUser(request);
    const body = createGroupSchema.parse(await request.json());
    const group = await prisma.$transaction(async (tx) => {
      const createdGroup = await tx.group.create({
        data: {
          name: body.name,
          members: {
            create: {
              userId: user.id,
              joinedAt: new Date()
            }
          }
        }
      });

      await writeAuditLog(
        {
          action: "CREATE_GROUP",
          actorUserId: user.id,
          groupId: createdGroup.id,
          entityType: "Group",
          entityId: createdGroup.id,
          metadata: { name: createdGroup.name }
        },
        tx
      );

      return createdGroup;
    });

    return json({ group }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
