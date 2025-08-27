// app/api/auth/signup/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const EMAIL_VERIFY_BASE_URL =
  process.env.EMAIL_VERIFY_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const name = (body?.name || "").toString().trim();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
    }

    // 1) Ensure a user exists (create if new)
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email, name: name || null },
        select: { id: true, email: true },
      });
    }

    // 2) Generate verification token (1 hour TTL)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    // 3) Store token using YOUR schema (userId, token, expires)
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    // 4) Build verify URL (we only include the token; server will resolve userId)
    const verifyUrl = `${EMAIL_VERIFY_BASE_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;

    // 5) Send email (replace with your real mailer). For now, log for testing.
    // await sendVerificationEmail({ to: email, verifyUrl });
    console.log("[SIGNUP] Verification URL:", verifyUrl);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/signup error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
