// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: [
    "/((?!api/auth|_next|_static|_vercel|favicon\\.ico|robots\\.txt|sitemap\\.xml|images|public).*)",
  ],
};

const ADMIN_PATH_PREFIX = "/admin";
const ADMIN_KEY_NAME = "admin_key";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // 0) Allow admin key via query (auto-set cookie then redirect cleanly)
  if (url.pathname.startsWith("/admin/enter-key")) {
    const qsKey = url.searchParams.get("key");
    if (qsKey) {
      const nextPath = url.searchParams.get("next") || "/admin";
      const redirectUrl = url.clone();
      redirectUrl.pathname = nextPath;
      redirectUrl.search = "";

      const res = NextResponse.redirect(redirectUrl, { status: 303 });
      res.cookies.set(ADMIN_KEY_NAME, qsKey, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }
  }

  // 1) Force HTTPS on Railway
  if (process.env.NODE_ENV === "production" && url.protocol === "http:") {
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 308 });
  }

  // 2) Canonical redirect
  if (url.hostname === "www.linkmint.co") {
    url.hostname = "linkmint.co";
    return NextResponse.redirect(url, { status: 308 });
  }

  // 3) Admin gate (normalize keys to avoid CR/LF/space issues)
  if (url.pathname.startsWith(ADMIN_PATH_PREFIX)) {
    if (url.pathname.startsWith("/admin/enter-key")) {
      return NextResponse.next();
    }

    const rawCookieKey = req.cookies.get(ADMIN_KEY_NAME)?.value ?? "";
    const rawHeaderKey = req.headers.get("x-admin-key") ?? "";
    const rawEnvKey = process.env.ADMIN_API_KEY ?? "";

    const cookieKey = rawCookieKey.trim();
    const headerKey = rawHeaderKey.trim();
    const adminKey = rawEnvKey.trim();

    const keyValid = !!adminKey && (cookieKey === adminKey || headerKey === adminKey);
    if (!keyValid) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/admin/enter-key";
      redirectUrl.searchParams.set("next", url.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 4) Dashboard auth
  if (url.pathname.startsWith("/dashboard")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("callbackUrl", url.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 5) Default
  return NextResponse.next();
}
