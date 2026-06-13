import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { publicUser, signAuthToken } from "@/lib/auth";
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
    return json({ user: safeUser, token: signAuthToken(safeUser) });
  } catch (error) {
    return handleApiError(error);
  }
}

