// app/api/debug/retrigger-verification/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

function isProd() {
  return process.env.NODE_ENV === "production";
}

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "admin@linkmint.co";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function assertProdAdmin() {
  if (!isProd()) return { ok: true as const };

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const admins = parseAdminEmails();

  if (!email || !admins.has(email)) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const };
}

export async function POST(req: Request) {
  try {
    // Gate access
    const gate = await assertProdAdmin();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const verifyToken = uuidv4();
    const verifyTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30m

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken,
        verifyTokenExpiry,
        emailVerified: false, // boolean schema
      },
    });

    // If you want email sending here:
    // await sendVerificationEmail(user.email, verifyToken);

    // In dev/preview: include token for convenience. In prod: don’t echo token.
    const body = isProd()
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
          note: "Token is included only in non-production environments.",
        };

    return NextResponse.json(body);
  } catch (err) {
    console.error("retrigger-verification POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
