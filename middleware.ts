// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * IMPORTANT:
 * - Do NOT run middleware on NextAuth endpoints, otherwise the auth callback
 *   may not set the session cookie.
 * - Also skip Next.js internals and static assets.
 */
export const config = {
  matcher: [
    // Run on everything EXCEPT the following:
    // - /api/auth/* (NextAuth)
    // - /_next/* and static assets
    // - /favicon.ico, /robots.txt, /sitemap.xml
    "/((?!api/auth|_next|_static|_vercel|favicon\\.ico|robots\\.txt|sitemap\\.xml|images|public).*)",
  ],
};

export function middleware(req: NextRequest) {
  // OPTIONAL: If you force canonical host/https, do it gently and only when needed.
  const url = req.nextUrl;

  // Force https (Railway should already be https, but keep this safe)
  if (url.protocol === "http:") {
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 308 });
  }

  // OPTIONAL: Force apex domain (remove www)
  if (url.hostname === "www.linkmint.co") {
    url.hostname = "linkmint.co";
    return NextResponse.redirect(url, { status: 308 });
  }

  return NextResponse.next();
}
