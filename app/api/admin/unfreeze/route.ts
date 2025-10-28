// app/api/admin/unfreeze/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

// Your hardcoded admin user id (per project context)
const ADMIN_USER_ID = "clwzud5zr0000v4l5gnkz1oz3";

// Helper: lightweight admin gate using either session or cookie "role=admin"
async function assertAdmin(request: Request) {
  // 1) Try session (preferred)
  try {
    const session = await getServerSession(authOptions as any);
    if (session?.user?.id === ADMIN_USER_ID) return true;
    // Some installs attach role; keep it permissive to your setup
    if ((session as any)?.user?.role === "admin") return true;
  } catch {
    // fall through to cookie check
  }

  // 2) Fallback cookie check: role=admin
  const cookieHeader = request.headers.get("cookie") || "";
  const isAdminCookie = cookieHeader
    .split(";")
    .map((s) => s.trim().toLowerCase())
    .some((s) => s.startsWith("role=admin"));

  return isAdminCookie;
}

export async function POST(request: Request) {
  try {
    const isAdmin = await assertAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId, email, resetTrustScore = true } = body || {};

    if (!userId && !email) {
      return NextResponse.json(
        { ok: false, error: "Provide either userId or email" },
        { status: 400 }
      );
    }

    // Locate the target user first (for clearer errors)
    const target = await prisma.user.findFirst({
      where: { OR: [{ id: userId ?? undefined }, { email: email ?? undefined }] },
      select: { id: true, email: true, name: true, disabled: true, trustScore: true },
    });

    if (!target) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Prepare update data
    const data: any = { disabled: false };
    if (resetTrustScore) data.trustScore = 0;

    const updated = await prisma.user.update({
      where: { id: target.id },
      data,
      select: { id: true, email: true, name: true, disabled: true, trustScore: true },
    });

    // (Optional) TODO: write to your internal event log / Telegram alert here

    return NextResponse.json({ ok: true, user: updated });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Simple health check / doc hint
  return NextResponse.json({
    ok: true,
    info: "POST { userId?: string, email?: string, resetTrustScore?: boolean } to unfreeze a user.",
  });
}
