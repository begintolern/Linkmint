// app/api/admin/merchant-rules/route.ts
export const runtime = "nodejs"; // critical: prevent Edge TLS issues
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type Status = "PENDING" | "ACTIVE" | "REJECTED";

// ---- GET: list merchant rules ----
export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Load recent merchant rules (no `select` to avoid schema mismatch)
    const rules = await prisma.merchantRule.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ ok: true, rules }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/admin/merchant-rules error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}

// ---- POST: update status (and active flag) ----
export async function POST(req: NextRequest) {
  try {
    // you can tighten this later; for now we keep same pattern as GET
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => null)) as
      | {
          id?: string;
          status?: string;
        }
      | null;

    if (!body?.id || !body?.status) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const nextStatus = body.status.toUpperCase() as Status;
    const valid: Status[] = ["PENDING", "ACTIVE", "REJECTED"];
    if (!valid.includes(nextStatus)) {
      return NextResponse.json(
        { ok: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updated = await prisma.merchantRule.update({
      where: { id: body.id },
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
    console.error("POST /api/admin/merchant-rules error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
