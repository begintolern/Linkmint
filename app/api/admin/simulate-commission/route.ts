// app/api/admin/simulate-commission/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type PostBody = { userId?: string; amount?: number };

export async function POST(req: Request) {
  try {
    // Auth
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true },
    });

    // Trust session role first, then DB role
    const sessionRole = String((session.user as any).role ?? "").toUpperCase();
    const dbRole = String(me?.role ?? "").toUpperCase();
    const role = sessionRole || dbRole;

    // Allowlist for safe override
    const ADMIN_EMAILS = new Set<string>(["epo78741@yahoo.com", "admin@linkmint.co"]);

    if (role !== "ADMIN" && !ADMIN_EMAILS.has(session.user.email!)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Input
    const body = (await req.json()) as PostBody;
    const userId = body.userId?.trim();
    const amount = Number(body.amount);
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "amount must be > 0" }, { status: 400 });
    }

    // Ensure target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Create pending commission
    const commission = await prisma.commission.create({
      data: {
        userId: targetUser.id,
        amount,
        status: "pending" as any, // adjust if your enum is uppercase
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: "Simulated commission created.",
      commissionId: commission.id,
      status: commission.status,
      amount: commission.amount,
    });
  } catch (err: any) {
    console.error("[simulate-commission] error:", err);
    return NextResponse.json({ success: false, error: err?.message ?? "Internal error" }, { status: 500 });
  }
}
