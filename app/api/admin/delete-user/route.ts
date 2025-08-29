// app/api/admin/delete-user/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

const ADMIN_EMAILS = new Set<string>(["epo78741@yahoo.com", "admin@linkmint.co"]);

export async function GET() {
  return NextResponse.json({ ok: true, route: "admin/delete-user" });
}

export async function POST(req: Request) {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;

  const emailOnSession = session?.user?.email?.toLowerCase() || "";
  const role = String((session?.user as any)?.role ?? "").toUpperCase();

  if (!emailOnSession) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!(role === "ADMIN" || ADMIN_EMAILS.has(emailOnSession))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { email?: string; userId?: string };
  const { email, userId } = body;

  if (!email && !userId) {
    return NextResponse.json({ success: false, error: "Provide email or userId" }, { status: 400 });
  }

  // Resolve target user
  const user =
    (userId &&
      (await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } }))) ||
    (email &&
      (await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })));

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const deletions: Record<string, number> = {};

      try {
        const r = await tx.commission.deleteMany({ where: { userId: user.id } });
        deletions.commissions = r.count;
      } catch {}

      try {
        const r = await tx.payout.deleteMany({ where: { userId: user.id } });
        deletions.payouts = r.count;
      } catch {}

      // Optional referral model cleanup (no-op if not present)
      try {
        // @ts-ignore
        const r1 = await tx.referral?.deleteMany({ where: { inviterUserId: user.id } });
        // @ts-ignore
        const r2 = await tx.referral?.deleteMany({ where: { referredUserId: user.id } });
        deletions.referrals = (r1?.count || 0) + (r2?.count || 0);
      } catch {}

      const deletedUser = await tx.user.delete({ where: { id: user.id } });

      return { deletedUserId: deletedUser.id, deletions };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
