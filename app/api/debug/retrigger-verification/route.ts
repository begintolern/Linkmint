export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.verifyToken || !user.verifyTokenExpiry) {
      return NextResponse.json({ success: false, error: "User or verification info not found" }, { status: 404 });
    }

    await sendVerificationEmail(user.email, user.verifyToken);
    return NextResponse.json({ success: true, message: `Verification email sent to ${user.email}` });
  } catch (error) {
    console.error("Error re-triggering verification:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
