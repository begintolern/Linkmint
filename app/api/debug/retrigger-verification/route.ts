// app/api/debug/retrigger-verification/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      select: { id: true, email: true, emailVerifiedAt: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // If already verified, you can choose to return early
    // if (user.emailVerifiedAt) {
    //   return NextResponse.json({ success: false, error: "Already verified" }, { status: 400 });
    // }

    const verifyToken = crypto.randomUUID();
    const verifyTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken,
        verifyTokenExpiry,
        // ✅ Reset verification timestamp instead of boolean
        emailVerifiedAt: null,
      },
    });

    // Optionally send the email (uncomment if your sender is ready)
    // await sendVerificationEmail(user.email, verifyToken);

    return NextResponse.json({ success: true, message: "Verification re-triggered." });
  } catch (err) {
    console.error("retrigger-verification error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
