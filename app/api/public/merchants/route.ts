// app/api/public/merchants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type MerchantRuleDTO = {
  id: string;
  merchantName: string;
  active: boolean;
  network: string | null;
  domainPattern: string | null;
  allowedSources: string[] | null;
  disallowedSources: string[] | null;
  defaultCommissionRate: number | null;
  commissionType: string | null;
  cookieWindowDays: number | null;
  payoutDelayDays: number | null;
  isGreyListed?: boolean | null;
  notes?: string | null;
};

function asStringArray(v: unknown): string[] | null {
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === "string" ? x : String(x))).filter(Boolean);
  }
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return null;
}

export async function GET() {
  try {
    const merchants = await prisma.merchantRule.findMany({
      where: { active: true },
      orderBy: { merchantName: "asc" },
    });

    const payload: MerchantRuleDTO[] = merchants.map((m: { id: any; merchantName: any; active: any; network: any; domainPattern: any; allowedSources: unknown; commissionType: unknown; cookieWindowDays: unknown; payoutDelayDays: unknown; notes: any; }): MerchantRuleDTO => ({
      id: m.id,
      merchantName: m.merchantName,
      active: m.active,
      network: m.network,
      domainPattern: m.domainPattern,
      allowedSources: asStringArray(m.allowedSources as unknown),
      disallowedSources: asStringArray((m as any)?.disallowed),
      defaultCommissionRate: asNumber((m as any)?.defaultCommissionRate),
      commissionType: (m.commissionType as unknown as string) ?? null,
      cookieWindowDays: asNumber(m.cookieWindowDays as unknown),
      payoutDelayDays: asNumber(m.payoutDelayDays as unknown),
      isGreyListed: (m as any)?.isGreyListed ?? null,
      notes: m.notes ?? null,
    }));

    return NextResponse.json({ ok: true, merchants: payload });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}
