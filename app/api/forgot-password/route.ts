export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email/sendPasswordResetEmail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({ email: "" }));
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) {
      return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true, email: true } });
    // Always respond OK to avoid user enumeration
    if (!user) return NextResponse.json({ ok: true });

    // Clear existing tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expires },
    });

    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
