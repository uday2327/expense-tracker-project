import jwt from "jsonwebtoken";
import { getEnv } from "@/lib/env";

const tokenMaxAge = "1d";
export const authCookieName = "flowledger_token";

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

export function getUserFromToken(token) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, getEnv().JWT_SECRET);
  } catch {
    return null;
  }
}

export function getUserFromRequest(request) {
  const header = request.headers.get("authorization");
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const cookieToken = request.cookies?.get?.(authCookieName)?.value;
  return getUserFromToken(bearerToken || cookieToken);
}

export function requireUser(request) {
  const user = getUserFromRequest(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export function setAuthCookie(response, token) {
  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24
  });
}

export function clearAuthCookie(response) {
  response.cookies.set(authCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
