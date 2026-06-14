import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { publicUser, setAuthCookie, signAuthToken } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user) {
      return json({ message: "Invalid email or password" }, 401);
    }

    const passwordMatches = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordMatches) {
      return json({ message: "Invalid email or password" }, 401);
    }

    const safeUser = publicUser(user);
    const token = signAuthToken(safeUser);
    const response = json({ user: safeUser, token });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
