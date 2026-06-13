import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { signAuthToken } from "../utils/jwt.js";

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

function publicUser(user: { id: string; name: string; email: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

export async function register(req: Request, res: Response) {
  const body = registerSchema.parse(req.body);
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email }
  });

  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash
    }
  });

  const safeUser = publicUser(user);
  return res.status(201).json({
    user: safeUser,
    token: signAuthToken(safeUser)
  });
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: body.email }
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(body.password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const safeUser = publicUser(user);
  return res.json({
    user: safeUser,
    token: signAuthToken(safeUser)
  });
}

export function me(req: Request, res: Response) {
  return res.json({ user: req.user });
}

