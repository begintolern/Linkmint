// app/api/signup/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";

function genReferralCode() {
  // 8 hex chars, good entropy and URL-safe
  return crypto.randomBytes(4).toString("hex");
}

function parseDOB(dob: unknown): Date | null {
  if (typeof dob !== "string" || !dob) return null;
  // Expecting YYYY-MM-DD from the form
  const d = new Date(dob);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isAdult(birthDate: Date): boolean {
  const today = new Date();
  const minDob = new Date(today);
  minDob.setFullYear(minDob.getFullYear() - 18);
  return birthDate <= minDob;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, dob, ageConfirm } = body ?? {};

    // Basic presence checks
    if (!email || !password || !dob || !ageConfirm) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    // Parse & validate DOB
    const birthDate = parseDOB(dob);
    if (!birthDate) {
      return NextResponse.json({ ok: false, error: "invalid_dob" }, { status: 400 });
    }

    // Enforce 18+
    if (!isAdult(birthDate)) {
      return NextResponse.json({ ok: false, error: "must_be_18_or_older" }, { status: 403 });
    }

    // Normalize email
    const normalized = String(email).toLowerCase().trim();

    // 1) Reject if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ ok: false, error: "account_exists" }, { status: 409 });
    }

    // 2) Create user
    const hash = await bcrypt.hash(String(password), 10);
    const created = await prisma.user.create({
      data: {
        email: normalized,
        name: (name ?? null) as string | null,
        password: hash,
        emailVerifiedAt: null,

        // NEW: age + DOB
        dob: birthDate,
        ageConfirmed: true,
        ageConfirmedAt: new Date(),
      },
      select: { id: true, email: true },
    });

    // 2a) Assign unique referralCode (retry on rare collision)
    for (let i = 0; i < 5; i++) {
      try {
        await prisma.user.update({
          where: { id: created.id },
          data: { referralCode: genReferralCode() },
        });
        break; // success
      } catch (e: any) {
        // Prisma unique constraint violation
        if (e?.code !== "P2002") throw e;
        if (i === 4) throw e; // give up after retries
      }
    }

    // 3) Create verification token (24h)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: created.id,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // 4) Send email (non-blocking)
    try {
      await sendVerificationEmail(created.email, token);
    } catch (e) {
      console.error("[signup] email send failed:", e);
    }

    return NextResponse.json({ ok: true, message: "verification_sent" }, { status: 201 });
  } catch (err) {
    console.error("[signup] ERROR", err);
    return NextResponse.json({ ok: false, error: "signup_failed" }, { status: 500 });
  }
}
