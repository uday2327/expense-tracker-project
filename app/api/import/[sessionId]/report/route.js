import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";

export async function GET(request, { params }) {
  try {
    requireUser(request);
    const sessionId = z.string().uuid().parse((await params).sessionId);
    const session = await prisma.importSession.findUnique({
      where: { id: sessionId },
      include: { anomalies: true }
    });

    if (!session) {
      return json({ message: "Import session not found" }, 404);
    }

    return json({
      filename: session.filename,
      status: session.status,
      importedAt: session.importedAt,
      anomalyCount: session.anomalies.length,
      anomalies: session.anomalies
    });
  } catch (error) {
    return handleApiError(error);
  }
}

