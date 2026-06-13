import jwt from "jsonwebtoken";
import { getEnv } from "@/lib/env";

const tokenMaxAge = "1d";

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

export function signAuthToken(user) {
  return jwt.sign(publicUser(user), getEnv().JWT_SECRET, { expiresIn: tokenMaxAge });
}

export function getUserFromRequest(request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, getEnv().JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireUser(request) {
  const user = getUserFromRequest(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}
