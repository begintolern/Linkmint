// app/api/verify-email/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }

    // Find token row by unique token (your schema: { id, userId, token, expires })
    const row = await prisma.verificationToken.findUnique({
      where: { token },
      select: { userId: true, token: true, expires: true },
    });
    if (!row) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 400 });
    }
    if (row.expires < new Date()) {
      // optional cleanup of expired token
      await prisma.verificationToken.delete({ where: { token: row.token } }).catch(() => {});
      return NextResponse.json({ success: false, error: "Token expired" }, { status: 400 });
    }

    // Mark user verified
    await prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    });

    // Consume token
    await prisma.verificationToken.delete({ where: { token: row.token } }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("GET /api/verify-email error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
