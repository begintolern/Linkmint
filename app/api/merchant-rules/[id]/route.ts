// app/api/merchant-rules/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const VALID_STATUSES = ["PENDING", "ACTIVE", "REJECTED"] as const;
type Status = (typeof VALID_STATUSES)[number];

type RouteParams = {
  params: {
    id: string;
  };
};

// PATCH /api/merchant-rules/:id  -> update status (+ active flag)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id in route" },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => null)) as
      | {
          status?: string;
        }
      | null;

    if (!body?.status) {
      return NextResponse.json(
        { ok: false, error: "Missing status in body" },
        { status: 400 }
      );
    }

    const nextStatus = body.status.toUpperCase() as Status;
    if (!VALID_STATUSES.includes(nextStatus)) {
      return NextResponse.json(
        { ok: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updated = await prisma.merchantRule.update({
      where: { id },
      data: {
        status: nextStatus,
        active: nextStatus === "ACTIVE",
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
    console.error("PATCH /api/merchant-rules/[id] error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Server error",
      },
      { status: 500 }
    );
  }
}
