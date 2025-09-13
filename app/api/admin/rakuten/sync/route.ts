// app/api/admin/rakuten/sync/route.ts
import { NextResponse } from "next/server";
import { listPartnerships } from "@/lib/partners/rakutenClient";
import { PrismaClient } from "@prisma/client";

const prisma = (globalThis as any).prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") (globalThis as any).prisma = prisma;

export const dynamic = "force-dynamic";

type RakutenPartnership = {
  advertiser: { id: number | string; name?: string };
  status: string; // "pending" | "approved" | "declined"
  apply_datetime?: string;
  approve_datetime?: string;
};

async function syncPage(status?: string, page = 1, pageSize = 50) {
  const data = (await listPartnerships({ status, page, pageSize })) as any;
  const items: RakutenPartnership[] = data?.partnerships ?? [];

  for (const p of items) {
    const advertiserId = String(p?.advertiser?.id ?? "");
    if (!advertiserId) continue;

    const name = p?.advertiser?.name ?? "Unknown";
    const st = (p?.status ?? "pending").toLowerCase();
    const appliedAt =
      p?.apply_datetime && p.apply_datetime !== "0001-01-01T00:00:00Z"
        ? new Date(p.apply_datetime)
        : new Date();

    const existing = await prisma.advertiserApplication.findFirst({
      where: { advertiserId },
      select: { id: true },
    });

    if (existing) {
      await prisma.advertiserApplication.update({
        where: { id: existing.id },
        data: { name, status: st, updatedAt: new Date() },
      });
    } else {
      await prisma.advertiserApplication.create({
        data: { advertiserId, name, status: st, appliedAt },
      });
    }
  }

  return {
    page: data?._metadata?.page ?? page,
    total: data?._metadata?.total ?? items.length,
    processed: items.length,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const status =
      typeof body?.status === "string" ? body.status.toUpperCase() : undefined;
    const page = Number(body?.page ?? 1);

    const result = await syncPage(status, page, 50);

    return NextResponse.json({ ok: true, status: status ?? "ALL", ...result });
  } catch (err: any) {
    console.error("Rakuten sync error:", err);
    return NextResponse.json(
      {
        ok: false,
        message: err?.message || "Unknown error",
        stack: err?.stack || null,
      },
      { status: 500 }
    );
  }
}
