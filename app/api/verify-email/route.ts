// app/api/verify-email/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/verify-email?token=XYZ
 * - Verifies token, marks user verified, deletes token
 * - Redirects to friendly pages (success or error)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/auth/verify-error?reason=missing", req.url));
    }

    const vt = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!vt) {
      return NextResponse.redirect(new URL("/auth/verify-error?reason=invalid", req.url));
    }

    if (vt.expires && vt.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(new URL("/auth/verify-error?reason=expired", req.url));
    }

    await prisma.user.update({
      where: { id: vt.userId },
      data: { emailVerifiedAt: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.redirect(new URL("/auth/verified", req.url));
  } catch {
    return NextResponse.redirect(new URL("/auth/verify-error?reason=unknown", req.url));
  }
}
