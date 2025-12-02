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
  viaShopeeMall?: boolean; // NEW FLAG
};

type RuleStatus = "ACTIVE" | "PENDING" | "REJECTED";

type RuleRow = {
  merchantName: string | null;
  status: string | null;
  active: boolean;
  commissionType: string | null;
  commissionRate: unknown;
};

// Homepage links per merchant
const MERCHANT_HOMEPAGES: Record<string, string> = {
  "charles-keith-ph": "https://www.charleskeith.com/ph",
  "asos-asia": "https://www.asos.com",
  "shopee-ph": "https://shopee.ph",
  "lazada-ph": "https://www.lazada.com.ph",
  "zalora-ph": "https://www.zalora.com.ph",
  "sephora-ph": "https://www.sephora.ph",
  "aliexpress-global": "https://best.aliexpress.com",
  "ecoflow-ph": "https://www.ecoflow.com/ph",
  "havaianas-ph": "https://havaianas.ph",
  "juicestore-ph": "https://juicestore.com",
  "love-bonito-ph": "https://www.lovebonito.com",
  "traveloka-ph": "https://www.traveloka.com/en-ph",
  "zataru-ph": "https://zataru.com",
  "shein-global": "https://ph.shein.com", // Added SHEIN homepage
};
const MERCHANTS: Merchant[] = [
  // ---------------- DIRECT MERCHANTS FIRST ----------------

  {
    id: "shopee-ph",
    name: "Shopee PH - CPS",
    region: "Philippines · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies by seller/category.",
    categoryFocus: "Everyday items, home goods, gadgets, fashion.",
    allowedTrafficNotes:
      "TikTok, Facebook, Messenger, IG Reels. Rules vary.",
    notes: "Extremely popular for PH users.",
    ruleMerchantName: "Shopee PH - CPS",
  },

  {
    id: "lazada-ph",
    name: "Lazada PH (via Accesstrade / networks)",
    region: "Philippines · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies by category.",
    categoryFocus: "Home, electronics, fashion, flagship stores.",
    allowedTrafficNotes:
      "TikTok, Facebook, IG content. Avoid coupon spam.",
    notes: "Best for official brands and big-ticket items.",
    ruleMerchantName: "Lazada PH",
  },

  {
    id: "aliexpress-global",
    name: "AliExpress (Global) - CPS",
    region: "Global · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies heavily by category.",
    categoryFocus: "Gadgets, home goods, accessories.",
    allowedTrafficNotes:
      "Organic unboxings/reviews. No coupon/cashback.",
    notes: "Strong for viral gadgets and trending items.",
    ruleMerchantName: "AliExpress (Global) - CPS",
  },

  {
    id: "shein-global",
    name: "SHEIN Global - CPS",
    region: "Global · Fashion",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies by category.",
    categoryFocus: "Fast fashion, accessories, home items.",
    allowedTrafficNotes:
      "Organic TikTok/IG/YouTube only.",
    notes: "Strong for hauls and outfit challenges.",
    ruleMerchantName: "Shein Global - CPS",
  },

  {
    id: "ecoflow-ph",
    name: "EcoFlow PH - CPS",
    region: "Philippines · Tech & Power",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "High-ticket CPS.",
    categoryFocus: "Portable power devices.",
    allowedTrafficNotes: "Organic tech content.",
    notes: "Great for travel and preparedness creators.",
    ruleMerchantName: "EcoFlow PH - CPS",
  },

  {
    id: "traveloka-ph",
    name: "Traveloka PH - CPS",
    region: "Philippines · Travel",
    status: "live",
    payoutSpeed: "slow",
    typicalCommission: "CPS on hotels/flights.",
    categoryFocus: "Travel bookings.",
    allowedTrafficNotes: "Organic travel content only.",
    notes: "Perfect for travel vloggers.",
    ruleMerchantName: "Traveloka PH - CPS",
  },
  {
    id: "zalora-ph",
    name: "Zalora PH",
    region: "Philippines · Fashion marketplace",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "Mid-level % on fashion.",
    categoryFocus: "Fashion, footwear, accessories.",
    allowedTrafficNotes: "Organic fashion content.",
    notes: "Checkout is handled via Shopee Mall (login required).",
    disclaimer: "Commission varies by campaign.",
    ruleMerchantName: "Zalora PH",
    viaShopeeMall: true,
  },

  // ---------------- SHOPEE-MALL MERCHANTS ----------------

  {
    id: "charles-keith-ph",
    name: "Charles & Keith PH",
    region: "Philippines · Fashion",
    status: "live",
    payoutSpeed: "slow",
    typicalCommission: "CPS via IA (varies).",
    categoryFocus: "Footwear, bags, accessories.",
    allowedTrafficNotes:
      "TikTok, IG Reels, Facebook content. Avoid coupon sites.",
    notes: "Checkout is handled via Shopee Mall (login required).",
    disclaimer: "Commission depends on IA approval.",
    ruleMerchantName: "Charles & Keith",
    viaShopeeMall: true,
  },

  {
    id: "asos-asia",
    name: "ASOS (Asia)",
    region: "Asia · Fashion",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "CPS via IA.",
    categoryFocus: "Clothing, shoes, accessories.",
    allowedTrafficNotes: "Organic fashion content only.",
    notes: "Checkout is processed via Shopee Mall (login required).",
    disclaimer: "Commission depends on IA approval.",
    ruleMerchantName: "ASOS (Asia) - CPS",
    viaShopeeMall: true,
  },

  {
    id: "juicestore-ph",
    name: "Juicestore (via IA)",
    region: "Philippines · Streetwear",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "CPS via IA.",
    categoryFocus: "Streetwear & sneakers.",
    allowedTrafficNotes: "Organic fashion content only.",
    notes: "Checkout is handled via Shopee Mall (login required).",
    disclaimer: "Commission depends on IA approval.",
    ruleMerchantName: "Juice Store",
    viaShopeeMall: true,
  },

  {
    id: "love-bonito-ph",
    name: "Love Bonito (PH)",
    region: "Philippines · Fashion",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "CPS via IA.",
    categoryFocus: "Women's fashion.",
    allowedTrafficNotes: "Organic IG/TikTok content only.",
    notes: "Checkout is processed via Shopee Mall (login required).",
    disclaimer: "Commission depends on IA approval.",
    ruleMerchantName: "Love Bonito (PH) - CPS",
    viaShopeeMall: true,
  },

  {
    id: "sephora-ph",
    name: "Sephora PH",
    region: "Philippines · Beauty",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Beauty CPS via IA.",
    categoryFocus: "Makeup & skincare.",
    allowedTrafficNotes:
      "GRWM, hauls, reviews (organic only).",
    notes: "Checkout is handled via Shopee Mall (login required).",
    disclaimer: "Rules depend on IA approval.",
    ruleMerchantName: "Sephora PH - CPS",
    viaShopeeMall: true,
  },

  // ---------------- OTHER DIRECT MERCHANTS ----------------

  {
    id: "havaianas-ph",
    name: "Havaianas PH",
    region: "Philippines · Footwear",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "CPS via IA.",
    categoryFocus: "Flip-flops & sandals.",
    allowedTrafficNotes: "Organic lifestyle content only.",
    notes: "Direct checkout via brand website.",
    disclaimer: "Commission depends on IA approval.",
    ruleMerchantName: "Havaianas PH",
  },

  {
    id: "zataru-ph",
    name: "Zataru PH",
    region: "Philippines · E-commerce",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "CPS via Accesstrade.",
    categoryFocus: "General catalog items.",
    allowedTrafficNotes: "Organic content only.",
    notes: "Great PH e-commerce option.",
    disclaimer: "Commission depends on AT approval.",
    ruleMerchantName: "Zataru PH",
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
      return "Planned / coming soon";
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
          {enhancedMerchants.map((m) => {
            const homepage = MERCHANT_HOMEPAGES[m.id];

            return (
              <article
                key={m.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <h2 className="text-sm font-semibold text-slate-50">
                        {m.name}
                      </h2>
                      {m.viaShopeeMall && (
                        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[9px] text-slate-300">
                          via Shopee Mall
                        </span>
                      )}
                    </div>

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
                      <p className="font-semibold text-slate-200">
                        Payout feel
                      </p>
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

                  <p className="mt-3 text-[11px] text-slate-300">
                    {m.notes}
                  </p>

                  {m.disclaimer && (
                    <p className="mt-2 text-[10px] text-slate-500">
                      {m.disclaimer}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/create-link"
                    className="inline-flex items-center rounded-full bg-teal-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-teal-400"
                  >
                    Create smart link
                  </Link>

                  {homepage && (
                    <a
                      href={homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-200 hover:border-teal-500 hover:text-slate-50"
                    >
                      Visit merchant site
                    </a>
                  )}

                  <Link
                    href="/tutorial"
                    className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-200 hover:border-teal-500 hover:text-slate-50"
                  >
                    Learn how to promote safely
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-5 text-[10px] text-slate-500">
          All information above is general and AI-assisted and does not override
          any official affiliate program terms.
        </p>
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
