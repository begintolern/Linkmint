// app/api/signup/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail"; // (to: string, token: string)

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 }
      );
    }

    const normalized = String(email).toLowerCase().trim();

    // 1) Reject if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "account_exists" },
        { status: 409 }
      );
    }

    // 2) Create user (let DB defaults handle role, etc.)
    const hash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        email: normalized,
        name: (name ?? null) as string | null,
        password: hash,
        emailVerifiedAt: null,
      },
      select: { id: true, email: true },
    });

    // 3) Create verification token
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // 4) Send email (mailer builds the /api/verify-email?token=... link from token)
    try {
      await sendVerificationEmail(user.email, token);
    } catch (e) {
      console.error("[signup] email send failed:", e);
    }

    return NextResponse.json(
      { ok: true, message: "verification_sent" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[signup] ERROR", err);
    return NextResponse.json(
      { ok: false, error: "signup_failed" },
      { status: 500 }
    );
  }
}
