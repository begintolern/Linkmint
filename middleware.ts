// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Public routes (no auth required)
const PUBLIC: string[] = [
  "/",
  "/login",
  "/signup",
  "/verify",
  "/trust-center",
  "/api/signup",
  "/api/verify-email",
];

// Protected route prefixes (auth required)
const PROTECTED: string[] = ["/dashboard", "/admin", "/account"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow public paths
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Only guard protected paths
  if (!PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read NextAuth JWT (from next-auth.session-token / __Secure-next-auth.session-token)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  // Optional: admin role guard
  // if (pathname.startsWith("/admin") && (token as any)?.role !== "ADMIN") {
  //   return NextResponse.redirect(new URL("/dashboard", req.url));
  // }

  return NextResponse.next();
}

// Run only on protected sections (efficient; avoids _next/static etc.)
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/account/:path*"],
};
