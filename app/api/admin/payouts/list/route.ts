export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

type Status = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

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

    const rows = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,                // ✅ include the ID
        createdAt: true,
        provider: true,
        statusEnum: true,
        netCents: true,
        feeCents: true,
        user: { select: { email: true, name: true } },
      },
    });

    const mapped = rows.map((r) => ({
      id: r.id,                                   // ✅ map ID
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
