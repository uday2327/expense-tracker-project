import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { assertGroupAccess } from "@/lib/services/authorization.service";
import { createImportReview } from "@/lib/services/import.service";
import { z } from "zod";

export async function POST(request) {
  try {
    const user = requireUser(request);
    const formData = await request.formData();
    const file = formData.get("file");
    const groupId = z.string().uuid().parse(formData.get("groupId"));

    if (!file || !groupId) {
      return json({ message: "file and groupId are required" }, 400);
    }
    await assertGroupAccess(user.id, groupId);

    const fileText = await file.text();
    const result = await createImportReview({
      fileText,
      filename: file.name || "expenses_export.csv",
      groupId,
      uploadedByUserId: user.id
    });

    return json(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
