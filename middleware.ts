// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(_req: NextRequest) {
  // No-op: let routes handle their own auth
  return NextResponse.next();
}

// Only run on diag endpoints (effectively disables middleware elsewhere)
export const config = {
  matcher: ["/api/diag/:path*"],
};
