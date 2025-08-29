// app/api/admin/debug/delete-user/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

const VERSION = "v1-delete-user-debug";
const ADMIN_EMAILS = new Set<string>(["epo78741@yahoo.com", "admin@linkmint.co"]);

type Body = { email?: string; userId?: string };

// GET probe so we can confirm the route exists
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "admin/debug/delete-user",
    version: VERSION,
  });
}

export async function POST(req: Request) {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  const sessionEmail = session?.user?.email?.toLowerCase() || "";
  const role = String((session?.user as any)?.role ?? "").toUpperCase();

  if (!sessionEmail) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!(role === "ADMIN" || ADMIN_EMAILS.has(sessionEmail))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { email, userId } = (await req.json()) as Body;
  if (!email && !userId) {
    return NextResponse.json({ success: false, error: "Provide email or userId" }, { status: 400 });
  }

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

      // If you have a Referral model, these blocks will work; if not, they noop.
      try {
        // @ts-ignore
        const r1 = await tx.referral?.deleteMany({ where: { inviterUserId: user.id } });
        // @ts-ignore
        const r2 = await tx.referral?.deleteMany({ where: { referredUserId: user.id } });
        // @ts-ignore
        deletions.referrals = (r1?.count || 0) + (r2?.count || 0);
      } catch {}

      const deletedUser = await tx.user.delete({ where: { id: user.id } });

      return { deletedUserId: deletedUser.id, deletions };
    });

    return NextResponse.json({ success: true, version: VERSION, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, version: VERSION, error: err?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
