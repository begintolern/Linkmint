// app/api/verify-email/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Absolute domain to avoid localhost redirects in prod
const BASE = "https://linkmint.co";

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
      return NextResponse.redirect(`${BASE}/auth/verify-error?reason=missing`);
    }

    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt) {
      return NextResponse.redirect(`${BASE}/auth/verify-error?reason=invalid`);
    }

    if (vt.expires && vt.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(`${BASE}/auth/verify-error?reason=expired`);
    }

    await prisma.user.update({
      where: { id: vt.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.redirect(`${BASE}/auth/verified`);
  } catch {
    return NextResponse.redirect(`${BASE}/auth/verify-error?reason=unknown`);
  }
}
