// app/api/diag/approve-commission/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

// We'll treat PROCESSING as "approved" for this test flow.
type PostBody = { commissionId?: string };

export async function POST(req: Request) {
  try {
    const raw = await getServerSession(authOptions);
    const session = raw as Session | null;
    const email = session?.user?.email ?? "";
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized (no session)" }, { status: 401 });
    }
    const ALLOW = new Set<string>(["epo78741@yahoo.com", "admin@linkmint.co"]);
    if (!ALLOW.has(email.toLowerCase())) {
      return NextResponse.json({ success: false, error: "Forbidden (not allowlisted)" }, { status: 403 });
    }

    const { commissionId } = (await req.json()) as PostBody;
    if (!commissionId) {
      return NextResponse.json({ success: false, error: "commissionId is required" }, { status: 400 });
    }

    const updated = await prisma.commission.update({
      where: { id: commissionId },
      data: { status: "PROCESSING" as any }, // PayoutStatus enum
      select: { id: true, status: true, amount: true, userId: true, type: true },
    });

    return NextResponse.json({ success: true, commission: updated });
  } catch (err: any) {
    console.error("[diag approve-commission] error:", err);
    return NextResponse.json({ success: false, error: err?.message ?? "Internal error" }, { status: 500 });
  }
}
