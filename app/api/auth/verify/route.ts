export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing token" },
        { status: 400 }
      );
    }

    // DEBUG: peek recent tokens
    const peek = await prisma.verificationToken.findMany({
      take: 3,
      orderBy: { expires: "desc" },
      select: { token: true, userId: true, expires: true },
    });
    console.log("[VERIFY DEBUG] recent tokens:", peek);

    // 1) Find token row
    const row = await prisma.verificationToken.findUnique({
      where: { token }, // token is unique in your model
      select: { userId: true, token: true, expires: true },
    });

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Invalid token" },
        { status: 400 }
      );
    }
    if (row.expires < new Date()) {
      await prisma.verificationToken
        .delete({ where: { token: row.token } })
        .catch(() => {});
      return NextResponse.json(
        { ok: false, error: "Token expired" },
        { status: 400 }
      );
    }

    // 2) Mark user as verified
    await prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    });

    // 3) Consume token
    await prisma.verificationToken
      .delete({ where: { token: row.token } })
      .catch(() => {});

    // 4) Redirect to login with success flag
    const base =
      process.env.EMAIL_VERIFY_REDIRECT_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000/login";

    const redirectUrl = base.includes("?")
      ? `${base}&verified=1`
      : `${base}?verified=1`;

    return NextResponse.redirect(redirectUrl);
  } catch (e) {
    console.error("GET /api/auth/verify error:", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
