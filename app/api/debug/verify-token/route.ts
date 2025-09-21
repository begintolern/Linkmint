// app/api/debug/verify-token/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function redactDb(url?: string) {
  if (!url) return "unknown";
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return "unparseable";
  }
}

/**
 * GET /api/debug/verify-token?token=... OR ?email=...
 * Read-only: shows what the LIVE app sees in its DB.
 * Delete after use.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  if (!token && !email) {
    return NextResponse.json(
      { ok: false, error: "Provide ?token=... or ?email=..." },
      { status: 400 }
    );
  }

  try {
    const where: any = {};
    if (token) where.verifyToken = token;
    if (email) where.email = email;

    const user = await prisma.user.findFirst({
      where,
      select: {
        id: true,
        email: true,
        verifyToken: true,
        verifyTokenExpiry: true,
        emailVerifiedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      db: redactDb(process.env.DATABASE_URL),
      input: { token: token ? token.slice(0, 8) + "…" : null, email },
      found: !!user,
      user: user
        ? {
            id: user.id,
            email: user.email,
            hasToken: !!user.verifyToken,
            tokenSnippet: user.verifyToken ? user.verifyToken.slice(0, 8) + "…" : null,
            tokenExpiry: user.verifyTokenExpiry,
            verifiedAt: user.emailVerifiedAt,
          }
        : null,
    });
  } catch (err) {
    console.error("debug/verify-token error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
