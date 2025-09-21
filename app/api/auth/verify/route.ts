// app/api/auth/verify/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Verifies an email via URL:
 *   GET /api/auth/verify?token=XXXX
 *
 * Redirects:
 *   /verify?reason=missing  -> no token in URL
 *   /verify?reason=invalid  -> token not found or expired
 *   /login?verified=1       -> success
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = (url.searchParams.get("token") || "").trim();

  try {
    if (!token) {
      console.info("verify: missing token");
      return NextResponse.redirect(new URL("/verify?reason=missing", url));
    }

    const now = new Date();

    // Your schema stores the token on the User record.
    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExpiry: { gt: now },
      },
      select: { id: true, email: true },
    });

    if (!user) {
      console.info("verify: invalid or expired", { tokenSnippet: token.slice(0, 8) });
      return NextResponse.redirect(new URL("/verify?reason=invalid", url));
    }

    // Mark verified and clear token so it can't be reused.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: now,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    console.info("verify: success", { userId: user.id, email: user.email });
    return NextResponse.redirect(new URL("/login?verified=1", url));
  } catch (err) {
    console.error("verify: internal error", err);
    return NextResponse.redirect(new URL("/verify?reason=error", url));
  }
}
