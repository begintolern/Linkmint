// app/api/auth/resend-verification/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) {
      return NextResponse.json({ success: false, error: "Email required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, emailVerifiedAt: true },
    });

    // Respond success even if not found (don’t leak users)
    if (!user) return NextResponse.json({ success: true });

    // If already verified, nothing to send
    if (user.emailVerifiedAt) return NextResponse.json({ success: true });

    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store token in VerificationToken
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    // Optional: mirror onto User if you still keep these columns
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken: token,
        verifyTokenExpiry: expires,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const verifyLink = `${baseUrl.replace(/\/$/, "")}/verify?token=${encodeURIComponent(token)}`;

    try {
      await sendVerificationEmail(user.email, verifyLink);
    } catch (e) {
      console.error("sendVerificationEmail failed:", e);
      // still return success; token was created
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("resend-verification error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
