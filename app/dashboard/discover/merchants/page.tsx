// app/dashboard/discover/merchants/page.tsx

import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
  status: unknown;
  active: boolean;
  commissionType: string | null;
  commissionRate: unknown;
};

const MERCHANT_HOMEPAGES: Record<string, string> = {
  "shopee-ph": "https://shopee.ph",
  "lazada-ph": "https://www.lazada.com.ph",
  "zalora-ph": "https://www.zalora.com.ph",
  "charles-keith-ph": "https://www.charleskeith.com/ph",
  "asos-asia": "https://www.asos.com",
  "juicestore-ph": "https://juicestore.com",
  "love-bonito-ph": "https://www.lovebonito.com",
  "sephora-ph": "https://www.sephora.ph",
  "aliexpress-global": "https://best.aliexpress.com",
  "temu-global": "https://www.temu.com",
  "shein-global": "https://ph.shein.com",
  "ecoflow-ph": "https://www.ecoflow.com/ph",
  "traveloka-ph": "https://www.traveloka.com/en-ph",
  "havaianas-ph": "https://havaianas.ph",
  "zataru-ph": "https://zataru.com",
};

const MERCHANTS: Merchant[] = [
  // ---------------- DIRECT MERCHANTS FIRST ----------------
  {
    id: "shopee-ph",
    name: "Shopee PH - CPS",
    region: `Philippines \u00B7 Marketplace`,
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies by seller/category.",
    categoryFocus: "Everyday items, home goods, gadgets, fashion.",
    allowedTrafficNotes: "TikTok, Facebook, Messenger, IG Reels. Rules vary.",
    notes: "Extremely popular for PH users.",
    ruleMerchantName: "Shopee PH - CPS",
  },

  {
    id: "lazada-ph",
    name: "Lazada PH (via Accesstrade / networks)",
    region: `Philippines \u00B7 Marketplace`,
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies by category.",
    categoryFocus: "Home, electronics, fashion, flagship stores.",
    allowedTrafficNotes: "TikTok, Facebook, IG content. Avoid coupon spam.",
    notes: "Best for official brands and big-ticket items.",
    ruleMerchantName: "Lazada PH (via Accesstrade / networks)",
  },

  {
    id: "aliexpress-global",
    name: "AliExpress (Global) - CPS",
    region: `Global \u00B7 Marketplace`,
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies heavily by category.",
    categoryFocus: "Gadgets, home goods, accessories.",
    allowedTrafficNotes: "Organic unboxings/reviews. No coupon/cashback.",
    notes: "Strong for viral gadgets and trending items.",
    ruleMerchantName: "AliExpress (Global) - CPS",
  },

  {
    id: "temu-global",
    name: "Temu (Global) - CPS",
    region: `Global \u00B7 Marketplace`,
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "CPS (varies by category/campaign).",
    categoryFocus: "Deals, gadgets, home items, accessories.",
    allowedTrafficNotes:
      "Organic short-form content works best. Avoid coupon spam and misleading claims.",
    notes: "Strong for viral deal-finds and trending items. Full sharing rules appear when creating a link.",
    ruleMerchantName: "Temu (Global) - CPS",
    // NOTE: We intentionally do NOT show the long Temu sharing rules here.
    // Those rules are shown only on /dashboard/create-link when Temu is selected.
  },

  {
    id: "shein-global",
    name: "SHEIN Global - CPS",
    region: `Global \u00B7 Fashion`,
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Varies by category.",
    categoryFocus: "Fast fashion, accessories, home items.",
    allowedTrafficNotes: "Organic TikTok/IG/YouTube only.",
    notes: "Strong for hauls and outfit challenges.",
    ruleMerchantName: "SHEIN Global - CPS",
  },

  {
    id: "ecoflow-ph",
    name: "EcoFlow PH - CPS",
    region: `Philippines \u00B7 Tech & Power`,
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
    region: `Philippines \u00B7 Travel`,
    status: "live",
    payoutSpeed: "slow",
    typicalCommission: "CPS on hotels/flights.",
    categoryFocus: "Travel bookings.",
    allowedTrafficNotes: "Organic travel content only.",
    notes: "Perfect for travel vloggers.",
    ruleMerchantName: "Traveloka PH - CPS",
  },

  // ---------------- VIA SHOPEE MALL / SPECIAL ----------------
  {
    id: "zalora-ph",
    name: "Zalora PH",
    region: `Philippines \u00B7 Fashion marketplace`,
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

  {
    id: "charles-keith-ph",
    name: "Charles & Keith PH",
    region: `Philippines \u00B7 Fashion`,
    status: "live",
    payoutSpeed: "slow",
    typicalCommission: "CPS via IA (varies).",
    categoryFocus: "Footwear, bags, accessories.",
    allowedTrafficNotes: "TikTok, IG Reels, Facebook content. Avoid coupon sites.",
    notes: "Checkout is handled via Shopee Mall (login required).",
    disclaimer: "Commission depends on IA approval.",
    ruleMerchantName: "Charles & Keith",
    viaShopeeMall: true,
  },

  {
    id: "asos-asia",
    name: "ASOS (Asia)",
    region: `Asia \u00B7 Fashion`,
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
    region: `Philippines \u00B7 Streetwear`,
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "CPS via IA.",
    categoryFocus: "Streetwear & sneakers.",
    allowedTrafficNotes: "Organic fashion content only.",
    notes: "Checkout is handled via Shopee Mall (login required).",
    disclaimer: "Commission depends on IA approval.",
    ruleMerchantName: "Juicestore",
    viaShopeeMall: true,
  },

  {
    id: "love-bonito-ph",
    name: "Love Bonito (PH)",
    region: `Philippines \u00B7 Fashion`,
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "CPS via IA.",
    categoryFocus: "Women's fashion.",
    allowedTrafficNotes: "Organic IG/TikTok content only.",
    notes: "Checkout is processed via Shopee Mall (login required).",
    disclaimer: "Commission depends on IA approval.",
    ruleMerchantName: "Love Bonito (PH)",
    viaShopeeMall: true,
  },

  {
    id: "sephora-ph",
    name: "Sephora PH",
    region: `Philippines \u00B7 Beauty`,
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Beauty CPS via IA.",
    categoryFocus: "Makeup & skincare.",
    allowedTrafficNotes: "GRWM, hauls, reviews (organic only).",
    notes: "Checkout is handled via Shopee Mall (login required).",
    disclaimer: "Rules depend on IA approval.",
    ruleMerchantName: "Sephora PH - CPS",
    viaShopeeMall: true,
  },

  // ---------------- OTHER DIRECT MERCHANTS ----------------
  {
    id: "havaianas-ph",
    name: "Havaianas PH",
    region: `Philippines \u00B7 Footwear`,
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
    region: `Philippines \u00B7 E-commerce`,
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
  if (raw === "APPROVED") return "ACTIVE";
  if (raw === "ACTIVE" || raw === "PENDING" || raw === "REJECTED") return raw;
  return "PENDING";
}

function normalizeKey(name: string | null | undefined): string {
  return (name || "").trim().toLowerCase();
}

function asPlainString(x: unknown): string {
  if (x == null) return "\u2014";
  try {
    if (typeof x === "object" && x !== null && "toString" in x) {
      // @ts-ignore
      return (x as any).toString();
    }
    return String(x);
  } catch {
    return "\u2014";
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
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "coming-soon":
      return "bg-slate-100 text-slate-700 border-slate-200";
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
      if (rule.active && rule.status === "ACTIVE") effectiveStatus = "live";
      else if (rule.status === "PENDING") effectiveStatus = "pending";
      else effectiveStatus = "coming-soon";

      const rateStr = asPlainString(rule.commissionRate);
      if (rule.commissionType || (rateStr && rateStr !== "\u2014")) {
        const typePart = rule.commissionType ? `${rule.commissionType} ` : "";
        effectiveCommission = `${typePart}@ ${rateStr}`.trim();
      }
    }

    return { ...m, status: effectiveStatus, typicalCommission: effectiveCommission };
  });

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Browse merchants</h1>
          <p className="mt-1 text-xs text-slate-600">
            linkmint.co works with top PH and global merchants via affiliate networks.
            Always follow official program rules.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {enhancedMerchants.map((m) => {
            const homepage = MERCHANT_HOMEPAGES[m.id];

            return (
              <article
                key={m.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-900">{m.name}</h2>
                      {m.viaShopeeMall && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
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

                  <p className="text-xs text-slate-600">{m.region}</p>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-slate-900">Payout feel</p>
                      <p className="mt-0.5">{payoutSpeedLabel(m.payoutSpeed)} (typical)</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Typical commission</p>
                      <p className="mt-0.5">{m.typicalCommission}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Category focus</p>
                      <p className="mt-0.5">{m.categoryFocus}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Traffic notes</p>
                      <p className="mt-0.5">{m.allowedTrafficNotes}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-700">{m.notes}</p>

                  {m.disclaimer && (
                    <p className="mt-2 text-[10px] text-slate-700">{m.disclaimer}</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/create-link?merchant=${encodeURIComponent(m.id)}`}
                    className="inline-flex items-center rounded-full bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    Create smart link
                  </Link>

                  {homepage && (
                    <a
                      href={homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 hover:border-teal-400 hover:text-slate-900"
                    >
                      Visit merchant site
                    </a>
                  )}

                  <Link
                    href="/tutorial"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 hover:border-teal-400 hover:text-slate-900"
                  >
                    Learn how to promote safely
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-5 text-[10px] text-slate-700">
          All information above is general and AI-assisted and does not override any
          official affiliate program terms.
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
