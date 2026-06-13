import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { rejectImport } from "@/lib/services/import.service";

const rejectSchema = z.object({
  reason: z.string().trim().max(500).optional()
});

export async function POST(request, { params }) {
  try {
    const user = requireUser(request);
    const sessionId = z.string().uuid().parse((await params).sessionId);
    const body = rejectSchema.parse(await request.json());
    const result = await rejectImport({
      sessionId,
      rejectedByUserId: user.id,
      reason: body.reason
    });

    return json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
