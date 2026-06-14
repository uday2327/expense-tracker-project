import { NextResponse } from "next/server";

const authCookieName = "flowledger_token";
const protectedPrefixes = ["/dashboard", "/groups", "/balances", "/import"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get(authCookieName)?.value;
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/groups/:path*", "/balances/:path*", "/import/:path*"]
};
