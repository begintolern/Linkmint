// app/api/admin/payouts/list/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

type Status = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

type Row = {
  id: string;
  createdAt: Date;
  provider: string | null;
  statusEnum: Status | null;
  netCents: number | null;
  feeCents: number | null;
  user: { email: string | null; name: string | null } | null;
};

export async function GET(req: Request) {
  try {
    // Admin auth
    const guard = await adminGuard();
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.reason }, { status: guard.status });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim() || "";
    const status = (searchParams.get("status") as Status | null) || null;

    const where: any = {};
    if (status) where.statusEnum = status;
    if (email) {
      where.user = {
        email: { contains: email, mode: "insensitive" },
      };
    }

    const rows: Row[] = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        provider: true,
        statusEnum: true,
        netCents: true,
        feeCents: true,
        user: { select: { email: true, name: true } },
      },
    });

    const mapped = rows.map((r: Row) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      provider: r.provider,
      statusEnum: r.statusEnum,
      netCents: r.netCents ?? null,
      feeCents: r.feeCents ?? null,
      email: r.user?.email ?? null,
      name: r.user?.name ?? null,
    }));

    return NextResponse.json({ ok: true, rows: mapped });
  } catch (err) {
    console.error("admin payouts/list error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
