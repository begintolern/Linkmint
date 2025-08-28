/**
 * ⚠️ SIMULATOR ONLY — Developer testing route
 * Not used in production logic.
 * Safe to remove or disable before launch.
 */


// app/api/simulate-commission/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

/**
 * ⚠️ SIMULATOR ONLY — Developer testing route
 * Not used in production logic. Safe to remove/disable before launch.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function POST(req: Request) {
  try {
    // Try JWT first
    const jwt = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);
    let email = (jwt as any)?.email as string | undefined;

    // Allow explicit override from body for local/testing
    if (!email) {
      try {
        const body = await req.json();
        if (typeof body?.email === "string") {
          email = body.email.trim().toLowerCase();
        }
      } catch {
        /* no body provided */
      }
    }

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized (no session or email provided)" }, { status: 401 });
    }

    // Who is the referrer?
    const me = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!me) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // Pick any referred user to pretend they purchased
    const invitee = await prisma.user.findFirst({
      where: { referredById: me.id },
      select: { id: true, email: true },
    });
    if (!invitee) {
      return NextResponse.json({
        success: false,
        error: "No referred users found. Run /api/simulate-referrals first.",
      }, { status: 400 });
    }

    // Simulated purchase/commission in cents
    const amountCents = 2599; // $25.99
    const inviteeCut = Math.round(amountCents * 0.80);
    const referrerCut = Math.round(amountCents * 0.05);
    const platformCut = amountCents - inviteeCut - referrerCut;

    // Try common shapes
    let commission: any = null;
    let variant: "A" | "B" | "C" | null = null;

    // Variant A: cents columns
    try {
      commission = await (prisma as any).commission.create({
        data: {
          inviteeId: invitee.id,
          referrerId: me.id,
          amountCents,
          inviteeAmountCents: inviteeCut,
          referrerAmountCents: referrerCut,
          platformAmountCents: platformCut,
          status: "PENDING",
        },
      });
      variant = "A";
    } catch (_) {}

    // Variant B: decimal amount columns
    if (!commission) {
      try {
        const toDollars = (c: number) => (c / 100).toFixed(2);
        commission = await (prisma as any).commission.create({
          data: {
            inviteeId: invitee.id,
            referrerId: me.id,
            amount: toDollars(amountCents),
            inviteeAmount: toDollars(inviteeCut),
            referrerAmount: toDollars(referrerCut),
            platformAmount: toDollars(platformCut),
            status: "PENDING",
          },
        });
        variant = "B";
      } catch (_) {}
    }

    // Variant C: minimal insert (let DB defaults/sp/trigger compute splits)
    if (!commission) {
      commission = await (prisma as any).commission.create({
        data: {
          inviteeId: invitee.id,
          referrerId: me.id,
          amountCents,
          status: "PENDING",
        },
      });
      variant = "C";
    }

    return NextResponse.json({
      success: true,
      variantUsed: variant,
      invitee,
      commissionId: commission?.id ?? null,
    });
  } catch (err: any) {
    console.error("simulate-commission error:", err);
    return NextResponse.json({ success: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}

