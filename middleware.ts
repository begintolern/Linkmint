// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

const ADMIN_PATH_PREFIX = "/admin";
const ADMIN_KEY_NAME = "admin_key";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // --- 1️⃣ Force HTTPS on Railway ---
  if (process.env.NODE_ENV === "production" && url.protocol === "http:") {
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 308 });
  }

  // --- 2️⃣ Canonical redirect: remove www ---
  if (url.hostname === "www.linkmint.co") {
    url.hostname = "linkmint.co";
    return NextResponse.redirect(url, { status: 308 });
  }

  // --- 3️⃣ Admin area protection ---
  if (url.pathname.startsWith(ADMIN_PATH_PREFIX)) {
    // Allow access to the key-entry page itself
    if (url.pathname.startsWith("/admin/enter-key")) {
      return NextResponse.next();
    }

    const cookieKey = req.cookies.get(ADMIN_KEY_NAME)?.value;
    const headerKey = req.headers.get("x-admin-key");
    const adminKey = process.env.ADMIN_API_KEY || "";

    const ok = !!adminKey && (cookieKey === adminKey || headerKey === adminKey);

    if (!ok) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/admin/enter-key";
      redirectUrl.searchParams.set("next", url.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // --- 4️⃣ Dashboard auth guard (unauthenticated → /signup) ---
  if (url.pathname.startsWith("/dashboard")) {
    // Read NextAuth session (JWT) from cookies. Requires NEXTAUTH_SECRET to be set.
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/signup"; // change to "/login" if you prefer
      redirectUrl.search = ""; // clean up querystring
      return NextResponse.redirect(redirectUrl);
    }
  }

  // --- Default pass-through ---
  return NextResponse.next();
}
