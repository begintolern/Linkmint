// app/api/admin/users/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { logAdminAction } from "@/lib/admin/log";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "clwzud5zr0000v4l5gnkz1oz3";

type AdminSession =
  | {
      user?: { id?: string; role?: string; email?: string | null } | null;
    }
  | null;

async function requireAdmin(): Promise<{ ok: boolean; actorId?: string; actorEmail?: string | null }> {
  const session = (await getServerSession(authOptions as any)) as AdminSession;
  const uid = session?.user?.id;
  const role = session?.user?.role;
  const email = session?.user?.email ?? null;
  if (uid && (uid === ADMIN_USER_ID || role === "admin")) {
    return { ok: true, actorId: uid, actorEmail: email };
  }
  return { ok: false };
}

// GET /api/admin/users?userId=&email=&page=1&limit=20
export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const userId = searchParams.get("userId") || undefined;
  const email = searchParams.get("email") || undefined;

  const where = userId || email ? { OR: [{ id: userId }, { email }] } : {};
  const total = await prisma.user.count({ where });
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" as const },
    skip: (page - 1) * limit,
    take: limit,
    select: { id: true, email: true, name: true, disabled: true, trustScore: true },
  });

  return NextResponse.json({ ok: true, total, page, limit, users });
}

// POST /api/admin/users
// Body: { action: "disable"|"enable"|"setTrustScore", userId?: string, email?: string, trustScore?: number }
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const action = String(body?.action || "");
  const userId = (body?.userId as string | undefined) ?? undefined;
  const email = (body?.email as string | undefined) ?? undefined;

  if (!userId && !email) {
    return NextResponse.json({ ok: false, error: "Provide userId or email" }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { OR: [{ id: userId }, { email }] },
    select: { id: true, email: true, name: true, disabled: true, trustScore: true },
  });
  if (!target) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  let updated;
  if (action === "disable") {
    updated = await prisma.user.update({
      where: { id: target.id },
      data: { disabled: true },
      select: { id: true, email: true, name: true, disabled: true, trustScore: true },
    });
    await logAdminAction(
      { actorId: gate.actorId, actorEmail: gate.actorEmail },
      "USER_DISABLE",
      "User",
      target.id,
      { before: { disabled: target.disabled }, after: { disabled: true } }
    );
  } else if (action === "enable") {
    updated = await prisma.user.update({
      where: { id: target.id },
      data: { disabled: false },
      select: { id: true, email: true, name: true, disabled: true, trustScore: true },
    });
    await logAdminAction(
      { actorId: gate.actorId, actorEmail: gate.actorEmail },
      "USER_ENABLE",
      "User",
      target.id,
      { before: { disabled: target.disabled }, after: { disabled: false } }
    );
  } else if (action === "setTrustScore") {
    const trustScore = Number(body?.trustScore);
    if (!Number.isFinite(trustScore)) {
      return NextResponse.json({ ok: false, error: "trustScore must be a number" }, { status: 400 });
    }
    updated = await prisma.user.update({
      where: { id: target.id },
      data: { trustScore },
      select: { id: true, email: true, name: true, disabled: true, trustScore: true },
    });
    await logAdminAction(
      { actorId: gate.actorId, actorEmail: gate.actorEmail },
      "USER_SET_TRUST",
      "User",
      target.id,
      { before: { trustScore: target.trustScore }, after: { trustScore } }
    );
  } else {
    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, user: updated });
}
