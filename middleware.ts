// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Only enforce in production on our real domain
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const url = req.nextUrl;
  const host = req.headers.get("host") || "";

  // Only apply to our site domain(s)
  const isOurDomain =
    host === "linkmint.co" || host === "www.linkmint.co";

  if (!isOurDomain) return NextResponse.next();

  // Force HTTPS (if somehow HTTP slipped through a proxy)
  if (url.protocol === "http:") {
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  // Force apex (no www)
  if (host === "www.linkmint.co") {
    url.hostname = "linkmint.co";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

// Let everything run; matcher can stay broad
export const config = { matcher: ["/:path*"] };
