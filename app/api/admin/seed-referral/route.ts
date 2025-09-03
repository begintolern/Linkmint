// app/api/admin/seed-referral/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { ensureBatchesFor } from "@/lib/referrals/createReferralBatch";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check admin
    const me = await prisma.user.findUnique({
      where: { email: token.email },
      select: { id: true, role: true, email: true },
    });
    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as any));
    const inviteeEmail = String(body?.inviteeEmail || "").trim().toLowerCase();
    const inviterEmail = String(body?.inviterEmail || me.email).trim().toLowerCase();

    if (!inviteeEmail) {
      return NextResponse.json({ ok: false, error: "Missing inviteeEmail" }, { status: 400 });
    }

    // Find inviter
    const inviter = await prisma.user.findUnique({
      where: { email: inviterEmail },
      select: { id: true, email: true },
    });
    if (!inviter) {
      return NextResponse.json({ ok: false, error: "Inviter not found" }, { status: 404 });
    }

    // Upsert invitee and attach referredById
    const invitee = await prisma.user.upsert({
      where: { email: inviteeEmail },
      create: { email: inviteeEmail, referredById: inviter.id, trustScore: 0 },
      update: { referredById: inviter.id },
      select: { id: true, email: true, referredById: true, createdAt: true },
    });

    // Recompute batches
    const { groups, ungroupedCount } = await ensureBatchesFor(inviter.id);

    return NextResponse.json({
      ok: true,
      inviter: inviter.email,
      invitee,
      ungroupedCount,
      groups: groups.map((g) => ({
        id: g.id,
        startedAt: g.startedAt,
        expiresAt: g.expiresAt,
        users: g.users.map((u) => u.email),
      })),
    });
  } catch (e: any) {
    console.error("POST /api/admin/seed-referral error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
