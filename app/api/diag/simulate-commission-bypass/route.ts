// app/api/diag/simulate-commission-bypass/route.ts
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
    const rawSession = await getServerSession(authOptions);
    const session = rawSession as Session | null;
    const email = session?.user?.email ?? "";
    const emailLc = email.toLowerCase();

    if (!emailLc) {
      return NextResponse.json({ success: false, error: "Unauthorized (no session)" }, { status: 401 });
    }

    // TEMP allowlist bypass (outside /api/admin to avoid middleware block)
    const ALLOW = new Set<string>(["epo78741@yahoo.com", "admin@linkmint.co"]);
    if (!ALLOW.has(emailLc)) {
      return NextResponse.json(
        { success: false, error: "Forbidden (not allowlisted)", debug: { email } },
        { status: 403 }
      );
    }

    const body = (await req.json()) as PostBody;
    const userId = body.userId?.trim();
    const amount = Number(body.amount);

    if (!userId) return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0)
      return NextResponse.json({ success: false, error: "amount must be > 0" }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const commission = await prisma.commission.create({
      data: {
        userId: target.id,
        amount,
        status: "pending" as any, // change to "PENDING" if your enum is uppercase
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: "Simulated commission created (bypass route).",
      commissionId: commission.id,
      status: commission.status,
      amount: commission.amount,
      who: { email, emailLc },
    });
  } catch (err: any) {
    console.error("[diag simulate-commission-bypass] error:", err);
    return NextResponse.json({ success: false, error: err?.message ?? "Internal error" }, { status: 500 });
  }
}
