import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { assertGroupAccess } from "@/lib/services/authorization.service";
import { getBalanceSummary } from "@/lib/services/balance.service";

export async function GET(request, { params }) {
  try {
    const user = requireUser(request);
    const groupId = z.string().uuid().parse((await params).groupId);
    await assertGroupAccess(user.id, groupId);
    return json(await getBalanceSummary(groupId));
  } catch (error) {
    return handleApiError(error);
  }
}
