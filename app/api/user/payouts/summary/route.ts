// app/api/user/payouts/summary/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type Status = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

function toInt(n: unknown) {
  return typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : 0;
}

export async function GET(req: NextRequest) {
  try {
    // -------- 1) Try JWT token (same as commissions/summary) --------
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    let userId: string | undefined;
    let emailFromAuth: string | undefined;

    if (token) {
      if (typeof token.sub === "string") {
        userId = token.sub;
      }
      if (typeof token.email === "string") {
        emailFromAuth = token.email;
      }
    }

    // -------- 2) Fallback: try getServerSession (App Router style) --------
    let sessionUser: any = null;
    if (!userId && !emailFromAuth) {
      const session = (await getServerSession(authOptions)) as any;
      if (session?.user) {
        sessionUser = session.user;
        if (typeof session.user.id === "string") {
          userId = session.user.id;
        }
        if (typeof session.user.email === "string") {
          emailFromAuth = session.user.email;
        }
      }
    }

    // Debug: what did auth give us (shows in Railway logs)
    console.log("PAYOUTS_AUTH_DEBUG", {
      hasToken: !!token,
      tokenEmail: token?.email,
      tokenSub: token?.sub,
      sessionUser,
      resolvedUserId: userId,
      resolvedEmail: emailFromAuth,
    });

    // -------- 3) If we still have no id/email → truly unauthorized --------
    if (!userId && !emailFromAuth) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    // -------- 4) Load user from DB (by id first, then email) --------
    let user = null;

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          disabled: true,
          deletedAt: true,
        },
      });
    }

    if (!user && emailFromAuth) {
      user = await prisma.user.findUnique({
        where: { email: emailFromAuth },
        select: {
          id: true,
          email: true,
          disabled: true,
          deletedAt: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (user.disabled || user.deletedAt) {
      return NextResponse.json(
        { ok: false, error: "ACCOUNT_DISABLED" },
        { status: 403 },
      );
    }

    const finalUserId = user.id;

    // -------- 5) Stats by status from payoutRequest --------
    const byStatus = await prisma.payoutRequest.groupBy({
      by: ["status"],
      where: { userId: finalUserId },
      _count: { _all: true },
      _sum: { amountPhp: true },
    });

    const stat = (s: Status) => {
      const g = byStatus.find((r) => r.status === s);
      return {
        count: g?._count._all ?? 0,
        amountPhp: toInt(g?._sum.amountPhp ?? 0),
      };
    };

    const summary = {
      PENDING: stat("PENDING"),
      PROCESSING: stat("PROCESSING"),
      PAID: stat("PAID"),
      FAILED: stat("FAILED"),
    };

    // -------- 6) Recent payout requests --------
    const recent = await prisma.payoutRequest.findMany({
      where: { userId: finalUserId },
      orderBy: { requestedAt: "desc" },
      take: 10,
      select: {
        id: true,
        amountPhp: true,
        method: true,
        provider: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        processorNote: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email },
      summary,
      totals: {
        requests: Object.values(summary).reduce((a, b) => a + b.count, 0),
        amountPhp: Object.values(summary).reduce(
          (a, b) => a + b.amountPhp,
          0,
        ),
      },
      recent,
    });
  } catch (err) {
    console.error("GET /api/user/payouts/summary error:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
