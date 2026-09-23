import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route-level auth guard.
 *
 * Defense-in-depth: every page and server action already checks
 * getServerSession() individually, but this proxy catches requests to
 * protected routes BEFORE they reach the render layer. If a developer
 * adds a new page under /admin, /dashboard, or /hunt and forgets the
 * auth check, this proxy redirects unauthenticated users to sign-in.
 *
 * NextAuth stores the session in a JWT cookie. In production, HTTPS
 * sets the cookie name to `__Secure-next-auth.session-token`; in
 * development it's `next-auth.session-token`. We check for both.
 */

const PROTECTED_PREFIXES = ["/admin", "/dashboard", "/hunt"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard protected route prefixes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Allow /hunt/preview for testing and review in development
  if (pathname === "/hunt/preview") {
    return NextResponse.next();
  }

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for NextAuth session cookie (JWT strategy)
  const hasSession =
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token");

  if (!hasSession) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/hunt/:path*"],
};
