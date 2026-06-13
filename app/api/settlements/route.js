import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { createSettlement } from "@/lib/services/settlement.service";
import { createSettlementSchema } from "@/lib/validators/settlement";

export async function POST(request) {
  try {
    requireUser(request);
    const body = createSettlementSchema.parse(await request.json());
    const settlement = await createSettlement({
      ...body,
      settledAt: body.settledAt ? new Date(body.settledAt) : new Date()
    });

    return json({ settlement }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

