import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { assertGroupAccess } from "@/lib/services/authorization.service";

export async function GET(request, { params }) {
  try {
    const user = requireUser(request);
    const sessionId = z.string().uuid().parse((await params).sessionId);
    const session = await prisma.importSession.findUnique({
      where: { id: sessionId },
      include: { anomalies: true }
    });

    if (!session) {
      return json({ message: "Import session not found" }, 404);
    }
    if (session.groupId) {
      await assertGroupAccess(user.id, session.groupId);
    }

    return json({
      id: session.id,
      filename: session.filename,
      groupId: session.groupId,
      status: session.status,
      importedAt: session.importedAt,
      confirmedAt: session.confirmedAt,
      rejectedAt: session.rejectedAt,
      rejectionReason: session.rejectionReason,
      stagedData: session.stagedData,
      anomalyCount: session.anomalies.length,
      anomalies: session.anomalies
    });
  } catch (error) {
    return handleApiError(error);
  }
}
