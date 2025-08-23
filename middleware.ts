// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Paths
const ADMIN_PAGES = ["/admin"];
const ADMIN_APIS = ["/api/admin"];
const PROTECTED_PAGES = ["/dashboard", "/account"];

const hasPrefix = (pathname: string, list: string[]) =>
  list.some((p) => pathname.startsWith(p));

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // --- Admin APIs: require ADMIN; respond with JSON ---
  if (hasPrefix(pathname, ADMIN_APIS)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = (token as any)?.role ?? "USER";
    if (role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // --- Admin pages: require ADMIN; use redirects ---
  if (hasPrefix(pathname, ADMIN_PAGES)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }
    const role = (token as any)?.role ?? "USER";
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // --- Auth-required pages (non-admin) ---
  if (hasPrefix(pathname, PROTECTED_PAGES)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Everything else: ignore
  return NextResponse.next();
}

// Only run where needed (keeps static assets & public pages untouched)
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/dashboard/:path*", "/account/:path*"],
};
