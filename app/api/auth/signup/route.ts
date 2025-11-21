// app/api/auth/signup/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendVerificationEmail from "@/lib/email/sendVerificationEmail";
import { logSignupRiskSafe } from "@/lib/risk/logSignupRisk";

/** Extract client IP from common proxy headers (Vercel/Railway/NGINX) */
function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const rip = req.headers.get("x-real-ip");
  return rip || null;
}

const SignupSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100, { message: "Password is too long" }),
  ageConfirmed: z.boolean().refine((v) => v === true, {
    message: "You must confirm you are 18+.",
  }),
  tosAccepted: z.boolean().refine((v) => v === true, {
    message: "You must agree to the Terms of Service and Privacy Policy.",
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input (enforces ageConfirmed & tosAccepted must be true)
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr =
        parsed.error.issues?.[0]?.message || "Invalid signup data.";
      return NextResponse.json({ ok: false, message: firstErr }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Prevent duplicate accounts
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { ok: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verifyToken = crypto.randomUUID();
    const verifyTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    // Timestamps & IP
    const now = new Date();
    const ip = getClientIp(req) ?? "unknown";
    const userAgent = req.headers.get("user-agent") || null;

    // Create user (✅ force NOT verified on creation)
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashed,

        emailVerifiedAt: null, // <-- ensure unverified at signup

        // Age policy
        ageConfirmed: true,
        ageConfirmedAt: now,

        // TOS acceptance audit
        tosAcceptedAt: now,
        tosAcceptedIp: ip,

        // Email verification
        verifyToken,
        verifyTokenExpiry,
      },
      select: { id: true, email: true },
    });

    // 🔒 SAFE signup risk logging (cannot break signup)
    try {
      await logSignupRiskSafe({
        userId: user.id,
        email: user.email,
        referredById: null, // we can wire real referral here later
        ip,
        userAgent,
      });
    } catch {
      // absolutely no-op if logging fails
    }

    // Send verification email (non-fatal if it fails; just inform user)
    try {
      await sendVerificationEmail(normalizedEmail, verifyToken);
    } catch {
      try {
        await prisma.eventLog.create({
          data: {
            type: "error",
            message: `sendVerificationEmail failed for ${normalizedEmail}`,
          },
        });
      } catch {}
      return NextResponse.json({
        ok: true,
        message:
          "Account created, but sending the verification email failed. Please try resending from the login screen.",
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Account created! Check your email to verify before logging in.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
