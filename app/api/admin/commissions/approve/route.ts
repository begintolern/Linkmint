// app/api/admin/commissions/approve/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

// Version probe so we can confirm deploy
const VERSION = "v1-admin-approve-commission";
const ADMIN_EMAILS = new Set<string>(["epo78741@yahoo.com", "admin@linkmint.co"]);

type PostBody = { commissionId?: string };

// GET probe (helpful to confirm the route is actually deployed)
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "admin/commissions/approve",
    version: VERSION,
  });
}

export async function POST(req: Request) {
  try {
    // AuthN
    const raw = await getServerSession(authOptions);
    const session = raw as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // AuthZ (admin check)
    const sessionRole = String((session.user as any).role ?? "").toUpperCase();
    const emailLc = session.user.email.toLowerCase();
    const isAdmin = sessionRole === "ADMIN" || ADMIN_EMAILS.has(emailLc);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Input
    const { commissionId } = (await req.json()) as PostBody;
    if (!commissionId) {
      return NextResponse.json({ success: false, error: "commissionId is required" }, { status: 400 });
    }

    // Update commission status to PROCESSING = "approved/cleared" in our flow
    // Your enum (from earlier) for status is PayoutStatus: PENDING | PROCESSING | PAID | FAILED
    const updated = await prisma.commission.update({
      where: { id: commissionId },
      data: { status: "PROCESSING" as any },
      select: { id: true, status: true, amount: true, userId: true, type: true },
    });

    return NextResponse.json({
      success: true,
      version: VERSION,
      commission: updated,
    });
  } catch (err: any) {
    console.error("[admin commissions/approve] error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Internal error", version: VERSION },
      { status: 500 }
    );
  }
}
