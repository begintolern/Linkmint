// app/api/admin/trigger-payout/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

const VERSION = "v1-admin-trigger-payout";
const ADMIN_EMAILS = new Set<string>(["epo78741@yahoo.com", "admin@linkmint.co"]);

type PostBody =
  | { userId: string; commissionId?: never }
  | { commissionId: string; userId?: never };

// Simple GET probe so we can verify deployment
export async function GET() {
  return NextResponse.json({ ok: true, route: "admin/trigger-payout", version: VERSION });
}

export async function POST(req: Request) {
  try {
    // Auth
    const raw = await getServerSession(authOptions);
    const session = raw as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionRole = String((session.user as any).role ?? "").toUpperCase();
    const emailLc = session.user.email.toLowerCase();
    const isAdmin = sessionRole === "ADMIN" || ADMIN_EMAILS.has(emailLc);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as PostBody;

    // MODE A: Payout a single approved commission
    if ("commissionId" in body && body.commissionId) {
      const commission = await prisma.commission.findUnique({
        where: { id: body.commissionId },
        select: { id: true, userId: true, amount: true, status: true, type: true },
      });
      if (!commission) {
        return NextResponse.json({ success: false, error: "Commission not found" }, { status: 404 });
      }
      if (commission.status !== "PROCESSING") {
        return NextResponse.json(
          { success: false, error: `Commission must be PROCESSING, got ${commission.status}` },
          { status: 400 },
        );
      }

      const txnId = `ADM-${Date.now()}`;
      const payout = await prisma.payout.create({
        data: {
          userId: commission.userId,
          amount: commission.amount,
          status: "PROCESSING" as any, // PayoutStatus: PENDING | PROCESSING | PAID | FAILED
          provider: "PAYPAL" as any,   // PayoutProvider: PAYPAL | PAYONEER
          method: "PAYPAL",            // required string in your schema
          transactionId: txnId,
          details: `Commission ${commission.id} paid via admin trigger`,
        } as any,
        select: { id: true, status: true, amount: true, provider: true, method: true, transactionId: true, details: true },
      });

      const [payoutFinal, commissionFinal] = await prisma.$transaction([
        prisma.payout.update({
          where: { id: payout.id },
          data: { status: "PAID" as any },
          select: { id: true, status: true, provider: true, method: true, transactionId: true },
        }),
        prisma.commission.update({
          where: { id: commission.id },
          data: { status: "PAID" as any },
          select: { id: true, status: true },
        }),
      ]);

      return NextResponse.json({
        success: true,
        version: VERSION,
        mode: "single-commission",
        payout: payoutFinal,
        commission: commissionFinal,
      });
    }

    // MODE B: Payout all approved (PROCESSING) commissions for a user
    if ("userId" in body && body.userId) {
      const commissions = await prisma.commission.findMany({
        where: { userId: body.userId, status: "PROCESSING" as any },
        select: { id: true, amount: true },
      });

      if (!commissions.length) {
        return NextResponse.json({
          success: false,
          error: "No PROCESSING commissions found for user",
        }, { status: 404 });
      }

      const total = commissions.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const txnId = `ADM-BULK-${Date.now()}`;

      const payout = await prisma.payout.create({
        data: {
          userId: body.userId,
          amount: total,
          status: "PROCESSING" as any,
          provider: "PAYPAL" as any,
          method: "PAYPAL",
          transactionId: txnId,
          details: `Bulk payout for ${commissions.length} commissions`,
        } as any,
        select: { id: true, status: true, amount: true, provider: true, method: true, transactionId: true, details: true },
      });

      // Mark all those commissions as PAID
      const updated = await prisma.$transaction(
        commissions.map((c) =>
          prisma.commission.update({
            where: { id: c.id },
            data: { status: "PAID" as any },
            select: { id: true, status: true },
          }),
        ),
      );

      // finalize payout
      const payoutFinal = await prisma.payout.update({
        where: { id: payout.id },
        data: { status: "PAID" as any },
        select: { id: true, status: true, amount: true, provider: true, method: true, transactionId: true, details: true },
      });

      return NextResponse.json({
        success: true,
        version: VERSION,
        mode: "bulk-user",
        payout: payoutFinal,
        commissionsPaid: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: "Provide either commissionId or userId" },
      { status: 400 },
    );
  } catch (err: any) {
    console.error("[admin trigger-payout] error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error", version: VERSION },
      { status: 500 },
    );
  }
}
