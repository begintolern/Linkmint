/**
 * ⚠️ SIMULATOR ONLY — Developer testing route
 * Not used in production logic.
 * Safe to remove or disable before launch.
 */


// app/api/simulate-commission/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { CommissionType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const jwt = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!jwt || !jwt.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: String(jwt.email).toLowerCase() },
      select: { id: true },
    });
    if (!me) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const body = await req.json().catch(() => ({} as any));
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    const typeInput = String(body.type ?? "SALE").toUpperCase();
    const type =
      (Object.values(CommissionType) as string[]).includes(typeInput)
        ? (typeInput as CommissionType)
        : CommissionType.referral_purchase;

    const commission = await prisma.commission.create({
      data: {
        userId: me.id,
        amount,
        type,
        status: "pending",
        source: body.source ?? "simulate",
        description: body.description ?? null,
      },
    });

    return NextResponse.json({ success: true, commission });
  } catch (e) {
    console.error("simulate-commission error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}


