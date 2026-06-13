import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { createGroupSchema } from "@/lib/validators/group";

export async function GET(request) {
  try {
    requireUser(request);
    const groups = await prisma.group.findMany({
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
    requireUser(request);
    const body = createGroupSchema.parse(await request.json());
    const group = await prisma.group.create({ data: { name: body.name } });

    return json({ group }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

