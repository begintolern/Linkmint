// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

// Protect ONLY dashboard pages. APIs will self-guard.
export const config = {
  matcher: ["/dashboard/:path*"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Read simple cookie-based session
  const cookieHeader = req.headers.get("cookie") || "";
  const hasUserId = /(^|;)\s*userId=/.test(cookieHeader);
  const hasEmail = /(^|;)\s*email=/.test(cookieHeader);

  if (url.pathname.startsWith("/dashboard")) {
    if (!hasUserId || !hasEmail) {
      // Redirect to home (adjust if you later add /login)
      const home = new URL("/", url.origin);
      return NextResponse.redirect(home);
    }
  }

  return NextResponse.next();
}
