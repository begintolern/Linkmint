// app/api/auth/resend/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail"; // (to: string, token: string)

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
    }
    const normalized = String(email).trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, emailVerifiedAt: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "no_account" }, { status: 404 });
    }
    if (user.emailVerifiedAt) {
      return NextResponse.json({ ok: false, error: "already_verified" }, { status: 409 });
    }

    // Clean up any existing tokens for this user (optional but recommended)
    await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

    // Create fresh token in your VerificationToken table (userId, token, expires)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // Send email with the token (your mailer should build the verify URL)
    // Example verify URL your mailer should use:
    // `${process.env.EMAIL_VERIFY_BASE_URL}/api/auth/verify?token=${token}`
    await sendVerificationEmail(user.email!, token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[resend] error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
