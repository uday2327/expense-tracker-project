import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { publicUser, signAuthToken } from "@/lib/auth";
import { handleApiError, json } from "@/lib/http";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request) {
  try {
    const body = registerSchema.parse(await request.json());
    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });

    if (existingUser) {
      return json({ message: "Email is already registered" }, 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash }
    });

    const safeUser = publicUser(user);
    return json({ user: safeUser, token: signAuthToken(safeUser) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

