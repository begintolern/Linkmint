// app/api/auth/verify/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Resolve absolute origin safely (prefer env; fall back to proxy headers). */
function getOrigin(req: NextRequest) {
  const envOrigin = process.env.BASE_URL || process.env.NEXTAUTH_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");

  const proto =
    req.headers.get("x-forwarded-proto") ||
    req.headers.get("x-forwarded-protocol") ||
    "https";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "linkmint.co";
  return `${proto}://${host}`.replace(/\/$/, "");
}

/**
 * Verifies an email via:
 *   GET /api/auth/verify?token=XXXX
 *
 * Redirects:
 *   {origin}/verify?reason=missing  -> no token
 *   {origin}/verify?reason=invalid  -> token not found or expired
 *   {origin}/login?verified=1       -> success
 */
export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  const urlToken = (new URL(req.url).searchParams.get("token") || "").trim();

  try {
    if (!urlToken) {
      console.info("verify: missing token");
      return NextResponse.redirect(`${origin}/verify?reason=missing`);
    }

    const now = new Date();

    const user = await prisma.user.findFirst({
      where: {
        verifyToken: urlToken,
        verifyTokenExpiry: { gt: now },
      },
      select: { id: true, email: true },
    });

    if (!user) {
      console.info("verify: invalid or expired", {
        tokenSnippet: urlToken.slice(0, 8),
      });
      return NextResponse.redirect(`${origin}/verify?reason=invalid`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: now,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    console.info("verify: success", { userId: user.id, email: user.email });
    return NextResponse.redirect(`${origin}/login?verified=1`);
  } catch (err) {
    console.error("verify: internal error", err);
    return NextResponse.redirect(`${origin}/verify?reason=error`);
  }
}
