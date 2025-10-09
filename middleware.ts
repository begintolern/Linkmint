// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Force HTTPS
  if (url.protocol === "http:") {
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  // Force apex domain (no www)
  if (url.hostname === "www.linkmint.co") {
    url.hostname = "linkmint.co";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

// Run on all paths
export const config = { matcher: ["/:path*"] };
