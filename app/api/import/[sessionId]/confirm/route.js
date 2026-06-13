import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { confirmImport } from "@/lib/services/import.service";

const confirmSchema = z.object({
  groupId: z.string().uuid()
});

export async function POST(request, { params }) {
  try {
    const user = requireUser(request);
    const sessionId = z.string().uuid().parse((await params).sessionId);
    const body = confirmSchema.parse(await request.json());
    const result = await confirmImport({
      sessionId,
      groupId: body.groupId,
      approvedByUserId: user.id
    });

    return json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

