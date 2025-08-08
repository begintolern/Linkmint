// app/api/debug/retrigger-verification/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { assertProdAdmin, isProd } from "@/lib/utils/adminGuard";
// import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";

export async function POST(req: Request) {
  try {
    const gate = await assertProdAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const verifyToken = uuidv4();
    const verifyTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExpiry, emailVerified: false },
    });

    // await sendVerificationEmail(user.email, verifyToken);

    return NextResponse.json(
      isProd()
        ? {
            success: true,
            message: "Verification token reset.",
            expiresAt: verifyTokenExpiry.toISOString(),
          }
        : {
            success: true,
            message: "Verification token reset.",
            token: verifyToken,
            expiresAt: verifyTokenExpiry.toISOString(),
            note: "Token omitted in production.",
          }
    );
  } catch (err) {
    console.error("retrigger-verification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
