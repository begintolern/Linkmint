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
    // 1) Session
    const rawSession = await getServerSession(authOptions);
    const session = rawSession as Session | null;

    const sessionEmail = session?.user?.email ?? "";
    if (!sessionEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", debug: { stage: "no-session" } },
        { status: 401 }
      );
    }

    // 2) Roles (trust session first, then DB)
    const me = await prisma.user.findUnique({
      where: { email: sessionEmail },
      select: { role: true },
    });

    const sessionRole = String((session?.user as any)?.role ?? "").toUpperCase();
    const dbRole = String(me?.role ?? "").toUpperCase();
    const role = sessionRole || dbRole;

    // Hard allowlist (your admin emails)
    const ADMIN_EMAILS = new Set<string>(["epo78741@yahoo.com", "admin@linkmint.co"]);
    const isAdmin = role === "ADMIN" || ADMIN_EMAILS.has(sessionEmail);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          debug: { sessionEmail, sessionRole, dbRole, role, allowlist: Array.from(ADMIN_EMAILS) },
        },
        { status: 403 }
      );
    }

    // 3) Input
    const body = (await req.json()) as PostBody;
    const userId = body.userId?.trim();
    const amount = Number(body.amount);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required", debug: { stage: "bad-input" } },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "amount must be > 0", debug: { stage: "bad-input" } },
        { status: 400 }
      );
    }

    // 4) Verify target user exists
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) {
      return NextResponse.json(
        { success: false, error: "User not found", debug: { stage: "no-target" } },
        { status: 404 }
      );
    }

    // 5) Create pending commission
    const commission = await prisma.commission.create({
      data: {
        userId: target.id,
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
      debug: { sessionEmail, sessionRole, dbRole, role },
    });
  } catch (err: any) {
    console.error("[simulate-commission] error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error", debug: { stage: "catch" } },
      { status: 500 }
    );
  }
}
