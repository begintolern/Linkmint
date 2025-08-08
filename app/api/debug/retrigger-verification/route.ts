// app/api/debug/retrigger-verification/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const verifyToken = uuidv4();
    const verifyTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken,
        verifyTokenExpiry,
        emailVerified: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Verification token reset.",
      token: verifyToken,
      expiresAt: verifyTokenExpiry.toISOString(),
    });
  } catch (err) {
    console.error("retrigger-verification POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
