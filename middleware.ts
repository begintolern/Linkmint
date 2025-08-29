// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_EMAILS = new Set<string>([
  "epo78741@yahoo.com",
  "admin@linkmint.co",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let everything else through
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // TEMP: allow diag endpoints while we finish tests
  if (pathname.startsWith("/api/diag/")) {
    return NextResponse.next();
  }

  // Protect /api/admin/*
  if (pathname.startsWith("/api/admin/")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    const emailLc = String(token.email).toLowerCase();
    const role = String((token as any).role ?? "").toUpperCase();

    if (role === "ADMIN" || ADMIN_EMAILS.has(emailLc)) {
      return NextResponse.next();
    }

    return new NextResponse(
      JSON.stringify({ success: false, error: "Forbidden" }),
      { status: 403, headers: { "content-type": "application/json" } }
    );
  }

  // Default allow for other /api/* routes
  return NextResponse.next();
}

// Run middleware on all API routes
export const config = {
  matcher: ["/api/:path*"],
};
