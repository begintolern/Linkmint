// app/api/verify-email/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // ✅ Use nextUrl to read query params in App Router
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Token missing" }, { status: 400 });
    }

    // Look up token (assumes `token` is unique)
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check expiry
    if (verificationToken.expires < new Date()) {
      return NextResponse.json({ success: false, error: "Token expired" }, { status: 400 });
    }

    // Mark user as verified
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Consume the token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return NextResponse.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
