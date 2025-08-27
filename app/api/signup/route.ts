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

    // 2) Create user
    const hash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        email: normalized,
        name: (name ?? null) as string | null,
        password: hash,
        emailVerifiedAt: null,
        role: "USER",   // ensure this matches your Prisma enum
        trustScore: 0,  // remove if not in your schema
      },
      select: { id: true, email: true },
    });

    // 3) Create verification token (stored in VerificationToken table)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // 4) Send verification email with the TOKEN (mailer builds the link)
    // Your sendVerificationEmail(to, token) should construct:
    //   `${process.env.EMAIL_VERIFY_BASE_URL}/verify?token=${token}`
    (async () => {
      try {
        await sendVerificationEmail(user.email, token);
      } catch (e) {
        console.error("[signup] email send failed:", e);
      }
    })();

    // 5) Respond — client should redirect to /check-email page
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
