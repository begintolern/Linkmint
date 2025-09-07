// app/api/signup/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";
import { sendSignupAlert } from "@/lib/alerts/sendSignupAlert";
import { logEvent } from "@/lib/log/logEvent";

// Read cap from env (public or server), fallback 100
const SIGNUP_CAP = Number(process.env.NEXT_PUBLIC_SIGNUP_CAP ?? process.env.SIGNUP_CAP ?? 100);

function genReferralCode() {
  return crypto.randomBytes(4).toString("hex"); // 8 hex chars, URL-safe
}

function parseDOB(dob: unknown): Date | null {
  if (typeof dob !== "string" || !dob) return null;
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

    // 🔒 Enforce signup cap (exclude ADMIN/TEST)
    const countedUsers = await prisma.user.count({
      where: { NOT: { role: { in: ["ADMIN", "TEST"] as any } } } as any,
    });
    if (countedUsers >= SIGNUP_CAP) {
      return NextResponse.json(
        {
          ok: false,
          error: "signups_closed",
          message: "Signups are limited. Please join the waitlist.",
          cap: SIGNUP_CAP,
        },
        { status: 403 }
      );
    }

    // Reject if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ ok: false, error: "account_exists" }, { status: 409 });
    }

    // Create user
    const hash = await bcrypt.hash(String(password), 10);
    const created = await prisma.user.create({
      data: {
        email: normalized,
        name: (name ?? null) as string | null,
        password: hash,
        emailVerifiedAt: null,
        dob: birthDate,
        ageConfirmed: true,
        ageConfirmedAt: new Date(),
        role: "USER", // ensure new users count toward cap
      } as any,
      select: { id: true, email: true },
    });

    // Assign unique referralCode (retry on rare collision)
    for (let i = 0; i < 5; i++) {
      try {
        await prisma.user.update({
          where: { id: created.id },
          data: { referralCode: genReferralCode() },
        });
        break;
      } catch (e: any) {
        if (e?.code !== "P2002") throw e;
        if (i === 4) throw e;
      }
    }

    // Create verification token (24h)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: created.id,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email (non-blocking)
    sendVerificationEmail(created.email, token).catch((e) => {
      console.error("[signup] email send failed:", e);
    });

    // 🔔 Telegram alert (non-blocking)
    sendSignupAlert(created.email).catch((e) => {
      console.error("sendSignupAlert failed:", e);
    });

    // 📝 Event log (non-blocking)
    logEvent("signup", `New signup: ${created.email}`, created.id).catch(() => {});

    return NextResponse.json({ ok: true, message: "verification_sent" }, { status: 201 });
  } catch (err) {
    console.error("[signup] ERROR", err);
    return NextResponse.json({ ok: false, error: "signup_failed" }, { status: 500 });
  }
}
