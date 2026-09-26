import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Route-level auth and role guard.
 *
 * Defense-in-depth: every page and server action already checks
 * getServerSession() individually, but this middleware/proxy catches requests to
 * protected routes BEFORE they reach the render layer.
 * Cryptographically verifies session token JWT signature using NEXTAUTH_SECRET.
 */

const PROTECTED_PREFIXES = ["/admin", "/dashboard", "/hunt"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow /hunt/preview only in development
  if (pathname === "/hunt/preview") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(new URL("/hunt", request.url));
    }
    return NextResponse.next();
  }

  // Only guard protected route prefixes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Cryptographically verify the session JWT using the NextAuth secret
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Enforce role-based access control for /admin
  if (pathname.startsWith("/admin") && token.role !== "ORGANIZER") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/hunt/:path*"],
};
