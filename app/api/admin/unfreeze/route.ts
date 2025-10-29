// app/api/admin/unfreeze/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { logAdminAction } from "@/lib/admin/log";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "clwzud5zr0000v4l5gnkz1oz3";

type AdminSession =
  | { user?: { id?: string; role?: string; email?: string | null } | null }
  | null;

async function requireAdmin(): Promise<{ ok: boolean; actorId?: string; actorEmail?: string | null }> {
  const session = (await getServerSession(authOptions as any)) as AdminSession;
  const uid = session?.user?.id;
  const role = session?.user?.role;
  const email = session?.user?.email ?? null;
  if (uid && (uid === ADMIN_USER_ID || role === "admin")) return { ok: true, actorId: uid, actorEmail: email };
  return { ok: false };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const userId = body?.userId as string | undefined;
  if (!userId) return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, disabled: true, trustScore: true },
  });
  if (!before) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { disabled: false, trustScore: 0 },
    select: { id: true, email: true, name: true, disabled: true, trustScore: true },
  });

  await logAdminAction(
    { actorId: gate.actorId, actorEmail: gate.actorEmail },
    "USER_UNFREEZE",
    "User",
    user.id,
    { before, after: { disabled: user.disabled, trustScore: user.trustScore } }
  );

  return NextResponse.json({ ok: true, user });
}
