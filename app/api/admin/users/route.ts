// app/api/admin/users/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

const ADMIN_USER_ID = "clwzud5zr0000v4l5gnkz1oz3";

// Lightweight admin check: session OR cookie role=admin
async function assertAdmin(request: Request) {
  try {
    const session: any = await getServerSession(authOptions as any);
    if (session?.user?.id === ADMIN_USER_ID) return true;
    if (session?.user?.role === "admin") return true;
  } catch {}
  const cookieHeader = request.headers.get("cookie") || "";
  const isAdminCookie = cookieHeader
    .split(";")
    .map((s) => s.trim().toLowerCase())
    .some((s) => s.startsWith("role=admin"));
  return isAdminCookie;
}

/**
 * GET /api/admin/users
 * - Peek single: ?userId=... OR ?email=...
 * - List: ?q=...&disabled=true|false&limit=25&page=1
 */
export async function GET(request: Request) {
  const isAdmin = await assertAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || undefined;
  const email = searchParams.get("email") || undefined;

  // Single user peek
  if (userId || email) {
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: userId }, { email }] },
      select: { id: true, email: true, name: true, disabled: true, trustScore: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    return NextResponse.json({ ok: true, user });
  }

  // List with filters
  const q = searchParams.get("q") || undefined;
  const disabledParam = searchParams.get("disabled");
  const limitParam = parseInt(searchParams.get("limit") || "25", 10);
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const limit = Math.min(Math.max(limitParam, 1), 100);
  const page = Math.max(pageParam, 1);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (disabledParam === "true") where.disabled = true;
  if (disabledParam === "false") where.disabled = false;

  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    take: limit,
    skip,
    orderBy: { id: "desc" },
    select: { id: true, email: true, name: true, disabled: true, trustScore: true },
  });

  const total = await prisma.user.count({ where });

  return NextResponse.json({
    ok: true,
    total,
    page,
    limit,
    users,
  });
}

/**
 * POST /api/admin/users
 * Body:
 *  {
 *    "action": "enable" | "disable" | "setTrustScore" | "unfreeze",
 *    "userId"?: string,
 *    "email"?: string,
 *    "trustScore"?: number    // used for setTrustScore
 *  }
 */
export async function POST(request: Request) {
  const isAdmin = await assertAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, userId, email, trustScore } = (body ?? {}) as {
    action?: "enable" | "disable" | "setTrustScore" | "unfreeze";
    userId?: string;
    email?: string;
    trustScore?: number;
  };

  if (!action) {
    return NextResponse.json({ ok: false, error: "Missing action" }, { status: 400 });
  }
  if (!userId && !email) {
    return NextResponse.json({ ok: false, error: "Provide userId or email" }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { OR: [{ id: userId ?? undefined }, { email: email ?? undefined }] },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  if (action === "enable" || action === "disable") {
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { disabled: action === "disable" },
      select: { id: true, email: true, name: true, disabled: true, trustScore: true },
    });
    return NextResponse.json({ ok: true, user: updated });
  }

  if (action === "setTrustScore") {
    if (typeof trustScore !== "number" || !Number.isFinite(trustScore)) {
      return NextResponse.json({ ok: false, error: "Invalid trustScore" }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { trustScore },
      select: { id: true, email: true, name: true, disabled: true, trustScore: true },
    });
    return NextResponse.json({ ok: true, user: updated });
  }

  if (action === "unfreeze") {
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { disabled: false, trustScore: 0 },
      select: { id: true, email: true, name: true, disabled: true, trustScore: true },
    });
    return NextResponse.json({ ok: true, user: updated });
  }

  return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
}
