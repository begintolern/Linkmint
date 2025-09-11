// app/api/user/merchants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // No 'select' to avoid TS mismatch with your current Prisma types
    const rows = await prisma.merchantRule.findMany({
      orderBy: [{ active: "desc" }, { merchantName: "asc" }],
    });

    const merchants = rows.map((r: any) => {
      // Normalize commission rate: prefer Decimal -> number, else Float 'rate'
      let commissionRateNum: number | null = null;
      if (r.commissionRate !== null && r.commissionRate !== undefined) {
        commissionRateNum = Number(r.commissionRate);
      } else if (typeof r.rate === "number") {
        commissionRateNum = r.rate;
      }

      const toText = (v: any) => {
        if (v == null) return null;
        if (typeof v === "string") return v;
        try { return JSON.stringify(v); } catch { return String(v); }
      };

      return {
        id: r.id,
        name: r.merchantName ?? null,
        domain: r.domainPattern ?? null,
        network: r.network ?? null,
        // Fallback to ACTIVE/PENDING using 'active' if your schema's 'status' isn't present at runtime
        status: r.status ?? (r.active ? "ACTIVE" : "PENDING"),
        commissionType: String(r.commissionType ?? ""),
        commissionRate: commissionRateNum,
        cookieDays: r.cookieWindowDays ?? null,
        payoutDelayDays: r.payoutDelayDays ?? null,
        notes: r.notes ?? null,
        allowed: toText(r.allowedSources),
        disallowed: toText(r.disallowed),
      };
    });

    return NextResponse.json({ merchants });
  } catch (err) {
    console.error("[api/user/merchants] error:", err);
    return NextResponse.json({ error: "Failed to fetch merchants" }, { status: 500 });
  }
}
