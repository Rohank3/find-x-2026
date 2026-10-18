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

const PROTECTED_PREFIXES = ["/admin", "/dashboard", "/hunt", "/api/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  // Strictly block /hunt/preview in production
  if (normalizedPath === "/hunt/preview" || normalizedPath.startsWith("/hunt/preview/")) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(new URL("/hunt", request.url));
    }
  }

  // Only guard protected route prefixes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
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
    if (normalizedPath.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Enforce role-based access control for /admin and /api/admin
  if (
    (normalizedPath === "/admin" ||
      normalizedPath.startsWith("/admin/") ||
      normalizedPath === "/api/admin" ||
      normalizedPath.startsWith("/api/admin/")) &&
    token.role !== "ORGANIZER"
  ) {
    if (normalizedPath.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden. Organizers only." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Restrict /hunt/preview even in non-production to ORGANIZER role
  if (
    (normalizedPath === "/hunt/preview" || normalizedPath.startsWith("/hunt/preview/")) &&
    token.role !== "ORGANIZER"
  ) {
    return NextResponse.redirect(new URL("/hunt", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/hunt/:path*", "/api/admin/:path*"],
};
