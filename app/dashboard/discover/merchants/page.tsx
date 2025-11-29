// app/dashboard/discover/merchants/page.tsx

import Link from "next/link";
import { prisma } from "@/lib/db";

type MerchantStatus = "live" | "pending" | "coming-soon";

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
};

type RuleStatus = "ACTIVE" | "PENDING" | "REJECTED";

type RuleRow = {
  merchantName: string | null;
  status: string | null;
  active: boolean;
  commissionType: string | null;
  commissionRate: unknown;
};

const MERCHANTS: Merchant[] = [
  {
    id: "charles-keith-ph",
    name: "Charles & Keith PH (via affiliate network)",
    region: "Philippines · Fashion · Footwear & bags",
    status: "live",
    payoutSpeed: "slow",
    typicalCommission: "Fashion range (varies by campaign and network)",
    categoryFocus: "Women’s footwear, bags, and accessories",
    allowedTrafficNotes:
      "Organic TikTok, IG Reels, FB content. Avoid coupon sites, brand bidding, and spam.",
    notes:
      "Great for sandals, handbags, and clean-girl styles. Pairs well with payday OOTD content.",
    disclaimer:
      "Commission depends on your affiliate network rules and approval.",
    ruleMerchantName: "Charles & Keith PH",
  },
  {
    id: "razer-involve-asia",
    name: "Razer (via affiliate networks such as Involve Asia)",
    region: "Philippines + regional · Gaming & peripherals",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "Tech peripherals range (mid to small %)",
    categoryFocus: "Gaming mice, keyboards, headsets",
    allowedTrafficNotes:
      "Organic gaming content, desk setups, YouTube reviews. Avoid brand bidding.",
    notes:
      "Strong for student gamers and casual players. Performs well with desk setup content.",
    disclaimer:
      "Always verify merchant rules inside your affiliate network.",
    ruleMerchantName: "Razer",
  },
  {
    id: "shopee-ph",
    name: "Shopee PH (via affiliate networks)",
    region: "Philippines · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies by seller/category",
    categoryFocus:
      "Everyday items, home goods, gadgets, fashion, TikTok finds.",
    allowedTrafficNotes:
      "Organic TikTok, FB groups, Messenger, IG Reels. Rules depend on the affiliate program.",
    notes:
      "Great for budol finds and payday hauls. Extremely familiar to PH audiences.",
    disclaimer: "Final rules depend on your affiliate program setup.",
    ruleMerchantName: "Shopee PH",
  },
  {
    id: "lazada-ph",
    name: "Lazada PH (via affiliate networks)",
    region: "Philippines · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Similar to Shopee",
    categoryFocus: "Home, electronics, fashion, flagship stores",
    allowedTrafficNotes:
      "Content-driven traffic via TikTok, FB, IG. Avoid spam, coupon misuse.",
    notes:
      "Great for official brands and bigger-ticket items. Good for comparison content.",
    disclaimer:
      "Commission depends on your affiliate approval and network rules.",
    ruleMerchantName: "Lazada PH",
  },
  {
    id: "zalora-ph",
    name: "Zalora PH (via affiliate networks)",
    region: "Philippines · Fashion marketplace",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "Mid-level % on eligible items",
    categoryFocus: "Fashion, footwear, accessories",
    allowedTrafficNotes:
      "Organic IG/TikTok content, OOTDs, style posts. Avoid coupon abuse.",
    notes:
      "Great for payday outfits and fashion-focused creators.",
    disclaimer:
      "Commission varies by campaign and category.",
    ruleMerchantName: "Zalora PH",
  },

  //
  // ⭐ NEW — SEPHORA PH
  //
  {
    id: "sephora-ph",
    name: "Sephora PH (via affiliate network)",
    region: "Philippines · Beauty & Skincare",
    status: "pending",
    payoutSpeed: "varies",
    typicalCommission: "Beauty & skincare range (IA CPS)",
    categoryFocus: "Makeup, skincare, fragrance, beauty tools",
    allowedTrafficNotes:
      "Organic TikTok GRWM, IG Reels, hauls, reviews. No coupon or cashback traffic.",
    notes:
      "Great for GRWM, skincare routines, and haul content. Performs best with authentic creator videos.",
    disclaimer:
      "Final rules and commissions depend on your Involve Asia setup.",
    ruleMerchantName: "Sephora PH - CPS",
  },

  //
  // ⭐ NEW — ALIEXPRESS GLOBAL
  //
  {
    id: "aliexpress-global",
    name: "AliExpress (Global)",
    region: "Global · Marketplace",
    status: "pending",
    payoutSpeed: "varies",
    typicalCommission:
      "CPS range (varies heavily by category and product)",
    categoryFocus:
      "Low-cost gadgets, home goods, fashion accessories, trending items",
    allowedTrafficNotes:
      "Organic content only—TikTok unboxing, IG Reels, YouTube reviews. No coupon sites, cashback, or brand bidding.",
    notes:
      "Strong for viral gadgets, budget finds, and international items. Best with unboxing and review content.",
    disclaimer:
      "Commission, availability, and rules depend on your Involve Asia approval.",
    ruleMerchantName: "AliExpress Global",
  },

  //
  // Generic IA card (unchanged)
  //
  {
    id: "involve-asia-generic",
    name: "Involve Asia partner merchants (general)",
    region: "Regional · PH, SEA, and beyond",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission:
      "Ranges from low to strong depending on category/merchant",
    categoryFocus:
      "Marketplaces, fashion, tech, travel, finance",
    allowedTrafficNotes:
      "Varies by merchant. Always follow merchant-specific rules.",
    notes:
      "Involve Asia offers access to thousands of merchants. Linkmint ensures compliant traffic routing.",
    disclaimer:
      "Each merchant has its own rules. Always rely on official terms.",
    ruleMerchantName: "Involve Asia",
  },
];

function normalizeRuleStatus(raw: unknown): RuleStatus {
  if (raw === "ACTIVE" || raw === "PENDING" || raw === "REJECTED") return raw;
  return "PENDING";
}

function normalizeKey(name: string | null | undefined): string {
  return (name || "").trim().toLowerCase();
}

function asPlainString(x: unknown): string {
  if (x == null) return "—";
  try {
    if (typeof x === "object" && x !== null && "toString" in x) {
      // @ts-ignore
      return (x as any).toString();
    }
    return String(x);
  } catch {
    return "—";
  }
}

function statusLabel(status: MerchantStatus): string {
  switch (status) {
    case "live":
      return "Live (approved)";
    case "pending":
      return "Pending / under review";
    case "coming-soon":
      return "Plcoming soon";
    default:
      return "";
  }
}

function statusBadgeClass(status: MerchantStatus): string {
  switch (status) {
    case "live":
      return "bg-teal-500/15 text-teal-200 border-teal-400/60";
    case "pending":
      return "bg-amber-500/15 text-amber-100 border-amber-400/60";
    case "coming-soon":
      return "bg-slate-500/20 text-slate-100 border-slate-400/60";
    default:
      return "";
  }
}

export default async function MerchantsPage() {
  const rules: RuleRow[] = await prisma.merchantRule.findMany({
    select: {
      merchantName: true,
      status: true,
      active: true,
      commissionType: true,
      commissionRate: true,
    },
  });

  const ruleMap = new Map<
    string,
    {
      status: RuleStatus;
      active: boolean;
      commissionType: string | null;
      commissionRate: unknown;
    }
  >();

  for (const r of rules) {
    const key = normalizeKey(r.merchantName);
    if (!key) continue;
    ruleMap.set(key, {
      status: normalizeRuleStatus(r.status),
      active: r.active,
      commissionType: r.commissionType,
      commissionRate: r.commissionRate,
    });
  }

  const enhancedMerchants = MERCHANTS.map((m) => {
    const key = normalizeKey(m.ruleMerchantName ?? m.name);
    const rule = key ? ruleMap.get(key) : undefined;

    let effectiveStatus: MerchantStatus = m.status;
    let effectiveCommission = m.typicalCommission;

    if (rule) {
      if (rule.active && rule.status === "ACTIVE") {
        effectiveStatus = "live";
      } else if (rule.status === "PENDING") {
        effectiveStatus = "pending";
      } else {
        effectiveStatus = "coming-soon";
      }

      const rateStr = asPlainString(rule.commissionRate);
      if (rule.commissionType || (rateStr && rateStr !== "—")) {
        const typePart = rule.commissionType ? `${rule.commissionType} ` : "";
        effectiveCommission = `${typePart}@ ${rateStr}`.trim();
      }
    }

    return {
      ...m,
      status: effectiveStatus,
      typicalCommission: effectiveCommission,
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-slate-50">
            Browse merchants
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            linkmint.co works with top PH and global merchants via affiliate
            networks. Always follow official program rules.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {enhancedMerchants.map((m) => (
            <article
              key={m.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-50">
                    {m.name}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(
                      m.status
                    )}`}
                  >
                    {statusLabel(m.status)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">{m.region}</p>

                <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-slate-200">Payout feel</p>
                    <p className="mt-0.5">
                      {payoutSpeedLabel(m.payoutSpeed)} (typical)
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">
                      Typical commission
                    </p>
                    <p className="mt-0.5">{m.typicalCommission}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">
                      Category focus
                    </p>
                    <p className="mt-0.5">{m.categoryFocus}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">
                      Traffic notes
                    </p>
                    <p className="mt-0.5">{m.allowedTrafficNotes}</p>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-slate-300">{m.notes}</p>

                {m.disclaimer && (
                  <p className="mt-2 text-[10px] text-slate-500">
                    {m.disclaimer}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/dashboard/links"
                  className="inline-flex items-center rounded-full bg-teal-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-teal-400"
                >
                  Create smart link with this merchant
                </Link>
                <Link
                  href="/tutorial"
                  className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-200 hover:border-teal-500 hover:text-slate-50"
                >
                  Learn how to promote safely
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function payoutSpeedLabel(speed: Merchant["payoutSpeed"]): string {
  switch (speed) {
    case "fast":
      return "Fast";
    case "normal":
      return "Normal";
    case "slow":
      return "Slower / more delayed";
    case "varies":
      return "Varies by category and campaign";
    default:
      return "";
  }
}
