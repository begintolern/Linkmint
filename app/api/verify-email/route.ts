// app/api/verify-email/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Core token verification against VerificationToken table.
 * - Looks up token (case-insensitive) that hasn't expired
 * - Marks the associated user (identifier = email) as verified
 * - Deletes the token so it can't be reused
 */
async function verifyTokenCore(token: string) {
  const now = new Date();

  // 1) Find a valid token row
  const vt = await prisma.verificationToken.findFirst({
    where: {
      token: { equals: token, mode: "insensitive" },
      expires: { gt: now },
    },
    select: { identifier: true, token: true },
  });

  if (!vt) {
    return { ok: false as const, error: "Invalid or expired token" };
  }

  // 2) Verify the user by email (identifier is the email)
  await prisma.user.updateMany({
    where: { email: vt.identifier },
    data: { emailVerified: true },
  });

  // 3) Remove the token so it cannot be reused
  await prisma.verificationToken.deleteMany({
    where: { token: { equals: token, mode: "insensitive" } },
  });

  return { ok: true as const };
}

function badRequest(msg: string) {
  return NextResponse.json({ success: false, error: msg }, { status: 400 });
}

function serverError(msg: string) {
  return NextResponse.json({ success: false, error: msg }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || url.searchParams.get("verifyToken");
    if (!token) return badRequest("Token missing");

    const res = await verifyTokenCore(token);
    if (!res.ok) return badRequest(res.error!);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-email GET error:", err);
    return serverError("Server error");
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { token?: string; verifyToken?: string };
    const token = body.token ?? body.verifyToken;
    if (!token || typeof token !== "string") return badRequest("Token missing");

    const res = await verifyTokenCore(token);
    if (!res.ok) return badRequest(res.error!);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-email POST error:", err);
    return serverError("Server error");
  }
}
