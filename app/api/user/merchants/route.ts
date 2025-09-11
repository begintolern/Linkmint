// app/api/user/merchants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await prisma.merchantRule.findMany({
      // Order by fields that exist in your model
      orderBy: [{ active: "desc" }, { merchantName: "asc" }],
      select: {
        id: true,
        active: true,
        merchantName: true,
        network: true,
        status: true,
        domainPattern: true,
        commissionType: true,
        commissionRate: true, // Decimal?
        rate: true,           // Float? (fallback)
        cookieWindowDays: true,
        payoutDelayDays: true,
        notes: true,
        allowedSources: true, // Json
        disallowed: true,     // Json
      },
    });

    const merchants = rows.map((r) => {
      // normalize Decimal/Float to number
      let commissionRateNum: number | null = null;
      if (r.commissionRate !== null && r.commissionRate !== undefined) {
        commissionRateNum = Number(r.commissionRate as unknown as any);
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
        name: r.merchantName,
        domain: r.domainPattern,
        network: r.network,
        status: r.status,
        commissionType: String(r.commissionType),
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
