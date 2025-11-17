// app/api/admin/merchant-rules/status/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

const VALID_STATUSES = ["PENDING", "ACTIVE", "REJECTED"] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null) as {
      id?: string;
      status?: string;
    } | null;

    if (!body || !body.id || !body.status) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const status = body.status.toUpperCase() as Status;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updated = await prisma.merchantRule.update({
      where: { id: body.id },
      data: {
        status,
        // convenience: keep `active` in sync with status
        active: status === "ACTIVE",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        rule: {
          id: updated.id,
          status: updated.status,
          active: updated.active,
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("POST /api/admin/merchant-rules/status error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Server error",
      },
      { status: 500 }
    );
  }
}
