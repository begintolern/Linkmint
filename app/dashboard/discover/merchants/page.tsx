import Link from "next/link";
import { prisma } from "@/lib/prisma";

/* ---------------- TYPES ---------------- */

type MerchantStatus = "live" | "pending" | "coming-soon";
type RuleStatus = "ACTIVE" | "PENDING" | "REJECTED";

type Merchant = {
  id: string;
  name: string;
  region: string;
  status: MerchantStatus;
  payoutSpeed: "fast" | "normal" | "slow" | "varies";
  typicalCommission: string;
  categoryFocus: string;
  allowedTrafficNotes: string;
  notes: string;
  disclaimer?: string;
  ruleMerchantName?: string;
  viaShopeeMall?: boolean;
};

type RuleRow = {
  merchantName: string | null;
  status: RuleStatus;
  active: boolean;
  commissionType: string | null;
  commissionRate: unknown;
};

/* ---------------- HOMEPAGES ---------------- */

const MERCHANT_HOMEPAGES: Record<string, string> = {
  "shopee-ph": "https://shopee.ph",
  "lazada-ph": "https://www.lazada.com.ph",
  "zalora-ph": "https://www.zalora.com.ph",
  "sephora-ph": "https://www.sephora.ph",
  "aliexpress-global": "https://best.aliexpress.com",
  "temu-global": "https://www.temu.com",
  "shein-global": "https://ph.shein.com",
  "ecoflow-ph": "https://www.ecoflow.com/ph",
  "havaianas-ph": "https://havaianas.ph",
  "juicestore-ph": "https://juicestore.com",
  "zataru-ph": "https://zataru.com",
};

/* ---------------- MERCHANT LIST ---------------- */

const MERCHANTS: Merchant[] = [
  {
    id: "shopee-ph",
    name: "Shopee PH - CPS",
    region: "Philippines · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies by seller/category.",
    categoryFocus: "General marketplace.",
    allowedTrafficNotes: "Organic content only.",
    notes: "Checkout via Shopee platform.",
    ruleMerchantName: "Shopee PH - CPS",
  },

  {
    id: "lazada-ph",
    name: "Lazada PH",
    region: "Philippines · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies by category.",
    categoryFocus: "General marketplace.",
    allowedTrafficNotes: "Organic content only.",
    notes: "Checkout via Lazada platform.",
    ruleMerchantName: "Lazada PH - CPS",
  },

  {
    id: "aliexpress-global",
    name: "AliExpress (Global)",
    region: "Global · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies by category.",
    categoryFocus: "Global catalog items.",
    allowedTrafficNotes: "Organic content only.",
    notes: "Global shipping.",
    ruleMerchantName: "AliExpress (Global) - CPS",
  },

  {
    id: "temu-global",
    name: "Temu (Global)",
    region: "Global · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "CPS (varies by campaign).",
    categoryFocus: "Deals, gadgets, home items.",
    allowedTrafficNotes:
      "Organic short-form content. No coupon spam or misleading claims.",
    notes: "Strong for viral deal discovery.",
    ruleMerchantName: "Temu (Global) - CPS",
  },

  {
    id: "shein-global",
    name: "SHEIN (Global)",
    region: "Global · Fashion",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Fashion CPS.",
    categoryFocus: "Fashion & apparel.",
    allowedTrafficNotes: "Organic fashion content.",
    notes: "Popular with TikTok creators.",
    ruleMerchantName: "SHEIN Global - CPS",
  },

  {
    id: "ecoflow-ph",
    name: "EcoFlow PH",
    region: "Philippines · Tech & Power",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "High-ticket CPS.",
    categoryFocus: "Power stations.",
    allowedTrafficNotes: "Organic reviews only.",
    notes: "High AOV products.",
    ruleMerchantName: "EcoFlow PH - CPS",
  },

  {
    id: "havaianas-ph",
    name: "Havaianas PH",
    region: "Philippines · Footwear",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "CPS.",
    categoryFocus: "Footwear.",
    allowedTrafficNotes: "Lifestyle content.",
    notes: "Direct checkout.",
    ruleMerchantName: "Havaianas PH",
  },

  {
    id: "zataru-ph",
    name: "Zataru PH",
    region: "Philippines · E-commerce",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "CPS.",
    categoryFocus: "General catalog.",
    allowedTrafficNotes: "Organic only.",
    notes: "Local PH merchant.",
    ruleMerchantName: "Zataru PH",
  },
];

/* ---------------- HELPERS ---------------- */

function normalizeRuleStatus(raw: unknown): RuleStatus {
  if (raw === "ACTIVE" || raw === "PENDING" || raw === "REJECTED") return raw;
  return "PENDING";
}

function normalizeKey(name?: string | null) {
  return (name || "").trim().toLowerCase();
}

function asPlainString(x: unknown) {
  if (x == null) return "—";
  return String(x);
}

function statusLabel(status: MerchantStatus) {
  if (status === "live") return "Live";
  if (status === "pending") return "Pending";
  return "Coming soon";
}

/* ---------------- PAGE ---------------- */

export default async function MerchantsPage() {
  const rawRules = await prisma.merchantRule.findMany({
    select: {
      merchantName: true,
      status: true,
      active: true,
      commissionType: true,
      commissionRate: true,
    },
  });

  const rules: RuleRow[] = rawRules.map((r) => ({
    merchantName: r.merchantName,
    status: normalizeRuleStatus(r.status),
    active: r.active,
    commissionType: r.commissionType
      ? String(r.commissionType)
      : null,
    commissionRate: r.commissionRate,
  }));

  const ruleMap = new Map(
    rules.map((r) => [normalizeKey(r.merchantName), r])
  );

  const enhanced = MERCHANTS.map((m) => {
    const rule = ruleMap.get(normalizeKey(m.ruleMerchantName ?? m.name));
    if (!rule) return m;

    let status: MerchantStatus = "coming-soon";
    if (rule.active && rule.status === "ACTIVE") status = "live";
    else if (rule.status === "PENDING") status = "pending";

    return {
      ...m,
      status,
      typicalCommission:
        rule.commissionType || rule.commissionRate
          ? `${rule.commissionType ?? ""} @ ${asPlainString(
              rule.commissionRate
            )}`.trim()
          : m.typicalCommission,
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-xl font-semibold">Browse merchants</h1>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {enhanced.map((m) => (
            <article
              key={m.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex justify-between">
                <h2 className="text-sm font-semibold">{m.name}</h2>
                <span className="text-xs text-slate-300">
                  {statusLabel(m.status)}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-400">{m.region}</p>

              <p className="mt-3 text-xs">{m.notes}</p>

              <div className="mt-4 flex gap-2">
                <Link
                  href="/dashboard/create-link"
                  className="rounded-full bg-teal-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
                >
                  Create smart link
                </Link>

                {MERCHANT_HOMEPAGES[m.id] && (
                  <a
                    href={MERCHANT_HOMEPAGES[m.id]}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-xs"
                  >
                    Visit site
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
