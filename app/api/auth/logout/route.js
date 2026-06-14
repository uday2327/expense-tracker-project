import { clearAuthCookie } from "@/lib/auth";
import { json } from "@/lib/http";

export async function POST() {
  const response = json({ ok: true });
  clearAuthCookie(response);
  return response;
}
