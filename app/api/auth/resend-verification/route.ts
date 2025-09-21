// app/api/auth/resend-verification/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";
import crypto from "crypto";

/** 24 hours */
const EXPIRY_MINUTES = 60 * 24;

/** Resolve absolute origin safely (env first, then proxy headers) */
function getOrigin(req: Request) {
  const envOrigin = process.env.BASE_URL || process.env.NEXTAUTH_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const u = new URL(req.url);
  const proto =
    (req.headers.get("x-forwarded-proto") ||
      req.headers.get("x-forwarded-protocol") ||
      u.protocol.replace(":", "") ||
      "https");
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    u.host;
  return `${proto}://${host}`.replace(/\/$/, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const emailRaw = typeof body?.email === "string" ? body.email : "";
    const email = emailRaw.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, message: "Email is required." },
        { status: 400 }
      );
    }

    // Find user; do not leak existence via status codes
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        verifyToken: true,
        verifyTokenExpiry: true,
      },
    });

    // If user not found, return generic success (avoid enumeration).
    if (!user) {
      return NextResponse.json({
        ok: true,
        message:
          "If an account exists for that email, we’ve sent a new verification link.",
      });
    }

    const now = new Date();
    const hasActiveToken =
      !!user.verifyToken &&
      !!user.verifyTokenExpiry &&
      user.verifyTokenExpiry > now;

    // Only block if verified AND no active token
    if (user.emailVerifiedAt && !hasActiveToken) {
      return NextResponse.json({
        ok: true,
        message: "Your email is already verified. You can log in.",
      });
    }

    // Issue fresh token (overwrites any previous). Only latest link will work.
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken: token,
        verifyTokenExpiry: expires,
      },
    });

    // Build canonical verify URL (same one used in the email)
    const origin = getOrigin(req);
    const verifyUrl = `${origin}/api/auth/verify?token=${encodeURIComponent(
      token
    )}`;

    // Send email (ignore return value, just log errors if thrown)
    try {
      await sendVerificationEmail(user.email, token);
    } catch (err) {
      console.error("resend-verification: email send failed", err);
    }

    // Also return verifyUrl so the frontend can offer "Verify now"
    return NextResponse.json({
      ok: true,
      message:
        "Verification email sent. You can also verify now using the button below.",
      verifyUrl,
    });
  } catch (err) {
    console.error("resend-verification POST error:", err);
    return NextResponse.json(
      { ok: false, message: "Could not send verification email." },
      { status: 500 }
    );
  }
}
