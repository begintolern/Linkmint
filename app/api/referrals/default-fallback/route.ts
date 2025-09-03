// app/api/referrals/default-fallback/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const founderEmail = process.env.FOUNDER_EMAIL?.trim();
    if (!founderEmail) {
      return NextResponse.json({ ok: false, error: "FOUNDER_EMAIL not set" }, { status: 500 });
    }

    const me = await prisma.user.findUnique({
      where: { email: token.email },
      select: { id: true, email: true, referredById: true },
    });
    if (!me) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    // Already referred? nothing to do
    if (me.referredById) {
      return NextResponse.json({ ok: true, attached: false, reason: "already_referred" });
    }

    const founder = await prisma.user.findUnique({
      where: { email: founderEmail },
      select: { id: true, email: true },
    });
    if (!founder) {
      return NextResponse.json({ ok: false, error: "Founder not found" }, { status: 500 });
    }

    // Prevent self-attach (if founder is the current user)
    if (founder.id === me.id) {
      return NextResponse.json({ ok: true, attached: false, reason: "self_account" });
    }

    await prisma.user.update({
      where: { id: me.id },
      data: { referredById: founder.id },
    });

    return NextResponse.json({
      ok: true,
      attached: true,
      user: me.email,
      inviter: founder.email,
      fallback: true,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
