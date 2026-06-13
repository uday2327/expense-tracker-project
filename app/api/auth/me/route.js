import { requireUser } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";

export async function GET(request) {
  try {
    return json({ user: requireUser(request) });
  } catch (error) {
    return handleApiError(error);
  }
}

