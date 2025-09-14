import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import sendVerificationEmail from "@/lib/email/sendVerificationEmail";

// Simple in-memory rate limit (per email) for this server instance.
// For multi-instance deploys, replace with Redis.
const LAST_SENT: Record<string, number> = {};
const WINDOW_MS = 1000 * 60; // 1 minute

const Schema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message || "Invalid request.";
      return NextResponse.json({ ok: false, message: msg }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();

    // Rate limit
    const last = LAST_SENT[email] || 0;
    const now = Date.now();
    if (now - last < WINDOW_MS) {
      return NextResponse.json(
        { ok: false, message: "Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    // Check user exists and is not already verified
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true },
    });

    if (!user) {
      // Do not reveal account existence — return generic OK
      return NextResponse.json({
        ok: true,
        message: "If an account exists, a new verification email will be sent.",
      });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({
        ok: true,
        message: "Email is already verified. You can log in.",
      });
    }

    // Issue new token
    const verifyToken = crypto.randomUUID();
    const verifyTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExpiry },
    });

    // Send email
    await sendVerificationEmail(email, verifyToken);

    LAST_SENT[email] = now;

    return NextResponse.json({
      ok: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
