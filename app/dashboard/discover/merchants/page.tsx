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
    name: "Charles & Keith PH",
    region: "Philippines · Fashion · Footwear & bags",
    status: "live",
    payoutSpeed: "slow",
    typicalCommission: "Fashion CPS range (varies by campaign and network)",
    categoryFocus: "Women’s footwear, bags, and accessories",
    allowedTrafficNotes:
      "Organic TikTok, IG Reels, Facebook content. Avoid coupon sites, brand bidding, and spam.",
    notes:
      "Great for sandals, handbags, and clean-girl styles. Pairs well with payday OOTD content.",
    disclaimer:
      "Commission depends on your affiliate network rules and approval.",
    ruleMerchantName: "Charles & Keith PH",
  },
  {
    id: "razer-cps",
    name: "Razer (CPS)",
    region: "Philippines + regional · Gaming & peripherals",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "Tech peripherals CPS (mid to small % per sale).",
    categoryFocus: "Gaming mice, keyboards, headsets, and accessories",
    allowedTrafficNotes:
      "Organic gaming content, setup tours, and YouTube reviews. Avoid brand bidding or impersonating official channels.",
    notes:
      "Strong for student gamers and casual players. Works well with desk setup and gameplay content.",
    disclaimer:
      "Always verify merchant rules inside your affiliate network.",
    ruleMerchantName: "Razer (CPS)",
  },
  {
    id: "shopee-ph",
    name: "Shopee PH",
    region: "Philippines · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission:
      "Small per order but scalable with volume; varies by seller and category.",
    categoryFocus:
      "Everyday items, home goods, gadgets, fashion, and “TikTok made me buy it” finds.",
    allowedTrafficNotes:
      "Organic TikTok, Facebook groups, Messenger, IG Reels. Rules depend on the affiliate program.",
    notes:
      "Great for budol finds and payday hauls. Extremely familiar to PH audiences.",
    disclaimer: "Final rules depend on your affiliate program setup.",
    ruleMerchantName: "Shopee PH",
  },
  {
    id: "lazada-ph",
    name: "Lazada PH",
    region: "Philippines · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission:
      "Similar to Shopee: small–mid per order depending on category.",
    categoryFocus: "Home, electronics, fashion, flagship stores.",
    allowedTrafficNotes:
      "Content-driven traffic via TikTok, Facebook, Instagram. Avoid spam and coupon misuse.",
    notes:
      "Great for official brands and bigger-ticket items. Good for comparison-style content (e.g., Shopee vs Lazada).",
    disclaimer:
      "Commission depends on your affiliate approval and network rules.",
    ruleMerchantName: "Lazada PH",
  },
  {
    id: "zalora-ph",
    name: "Zalora PH",
    region: "Philippines · Fashion marketplace",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "Mid-level % on eligible fashion items.",
    categoryFocus: "Fashion, footwear, and accessories",
    allowedTrafficNotes:
      "Organic IG/TikTok content, OOTDs, and style posts. Avoid coupon abuse and spammy reposting.",
    notes:
      "Great for payday outfits and fashion-focused creators in PH.",
    disclaimer:
      "Commission varies by campaign and category.",
    ruleMerchantName: "Zalora PH",
  },

  //
  // Sephora PH - CPS
  //
  {
    id: "sephora-ph",
    name: "Sephora PH - CPS",
    region: "Philippines · Beauty & Skincare",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "Beauty & skincare CPS via Involve Asia.",
    categoryFocus: "Makeup, skincare, fragrance, and beauty tools",
    allowedTrafficNotes:
      "Organic TikTok GRWM, IG Reels, YouTube hauls and reviews. No coupon or cashback traffic.",
    notes:
      "Great for GRWM, skincare routines, and honest haul content. Performs best with authentic creator videos.",
    disclaimer:
      "Final rules and commissions depend on your Involve Asia setup.",
    ruleMerchantName: "Sephora PH - CPS",
  },

  //
  // AliExpress Global
  //
  {
    id: "aliexpress-global",
    name: "AliExpress Global",
    region: "Global · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission:
      "CPS range (varies heavily by category and product) via Involve Asia.",
    categoryFocus:
      "Low-cost gadgets, home goods, fashion accessories, and trending items.",
    allowedTrafficNotes:
      "Organic content only — unboxings, reviews, and ‘TikTok made me buy it’ content. No coupon sites, cashback, or brand bidding.",
    notes:
      "Strong for viral gadgets, budget finds, and international items. Best with unboxing and review-style content.",
    disclaimer:
      "Commission, availability, and rules depend on your AliExpress approval in Involve Asia.",
    ruleMerchantName: "AliExpress (Global)",
  },

  //
  // ASOS (Asia) - CPS
  //
  {
    id: "asos-asia",
    name: "ASOS (Asia) - CPS",
    region: "Asia · Fashion",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "Fashion CPS % via Involve Asia.",
    categoryFocus: "Clothing, shoes, and accessories for men and women.",
    allowedTrafficNotes:
      "Organic fashion content (TikTok, IG, YouTube). No coupon/cashback traffic or brand bidding.",
    notes:
      "Good for fashion hauls and ‘ASOS finds’ content, especially for PH users who like international styles.",
    disclaimer:
      "Commission and rules depend on your ASOS (Asia) - CPS approval in Involve Asia.",
    ruleMerchantName: "ASOS (Asia) - CPS",
  },

  //
  // Havaianas PH
  //
  {
    id: "havaianas-ph",
    name: "Havaianas PH",
    region: "Philippines · Footwear",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "CPS % on eligible sandals via Involve Asia.",
    categoryFocus: "Flip-flops, sandals, and casual footwear.",
    allowedTrafficNotes:
      "Organic lifestyle content, OOTDs, and beach/travel posts. No coupon/cashback or arbitrage traffic.",
    notes:
      "Great for summer, beach, and casual outfit content. Very familiar brand for PH buyers.",
    disclaimer:
      "Commission and availability depend on your Havaianas PH approval in Involve Asia.",
    ruleMerchantName: "Havaianas PH",
  },

  //
  // EcoFlow PH - CPS
  //
  {
    id: "ecoflow-ph",
    name: "EcoFlow PH - CPS",
    region: "Philippines · Tech & Power",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission:
      "Higher-ticket CPS on power stations and accessories.",
    categoryFocus: "Portable power stations, solar panels, and backup power.",
    allowedTrafficNotes:
      "Organic YouTube reviews, TikTok explainers, and Facebook posts. Avoid coupon/cashback or misleading claims.",
    notes:
      "Best for tech, preparedness, and travel creators where backup power is relevant.",
    disclaimer:
      "Commission depends on your EcoFlow PH - CPS approval in Involve Asia.",
    ruleMerchantName: "EcoFlow PH - CPS",
  },

  //
  // Juicestore
  //
  {
    id: "juicestore-ph",
    name: "Juicestore",
    region: "Philippines · Fashion & streetwear",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "CPS % on streetwear items via Involve Asia.",
    categoryFocus: "Streetwear, sneakers, and limited drops.",
    allowedTrafficNotes:
      "Organic fashion and streetwear content. No coupon sites or cashback traffic.",
    notes:
      "Good fit for sneakerheads and streetwear creators in PH.",
    disclaimer:
      "Commission depends on your Juicestore approval in Involve Asia.",
    ruleMerchantName: "Juice Store",
  },

  //
  // Love Bonito (PH)
  //
  {
    id: "love-bonito-ph",
    name: "Love Bonito (PH)",
    region: "Philippines · Women’s fashion",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "Fashion CPS % via Involve Asia.",
    categoryFocus: "Women’s fashion with Asian-fit cuts and styles.",
    allowedTrafficNotes:
      "Organic IG/TikTok fashion content, try-ons, and styling videos.",
    notes:
      "Strong for women’s fashion creators targeting PH and wider SEA audiences.",
    disclaimer:
      "Commission depends on your Love Bonito (PH) approval in Involve Asia.",
    ruleMerchantName: "Love Bonito (PH)",
  },

  //
  // SHEIN Global
  //
  {
    id: "shein-global",
    name: "SHEIN Global",
    region: "Global · Fast fashion",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission: "CPS % via Involve Asia (varies by category).",
    categoryFocus: "Fast fashion, accessories, and home items.",
    allowedTrafficNotes:
      "Organic TikTok, IG, and YouTube fashion content. No coupon/cashback or paid ads using brand terms.",
    notes:
      "Very strong for hauls, outfit challenges, and budget fashion content.",
    disclaimer:
      "Commission depends on your SHEIN Global CPS approval in Involve Asia.",
    ruleMerchantName: "Shein Global - CPS",
  },

  //
  // Traveloka PH - CPS
  //
  {
    id: "traveloka-ph",
    name: "Traveloka PH - CPS",
    region: "Philippines · Travel",
    status: "live",
    payoutSpeed: "slow",
    typicalCommission:
      "Travel CPS % on flights, hotels, and experiences via Involve Asia.",
    categoryFocus: "Flights, hotels, and travel deals for PH users.",
    allowedTrafficNotes:
      "Organic travel content, vlogs, and itinerary videos. No coupon/cashback or incentive traffic.",
    notes:
      "Best for travel creators highlighting PH and regional trips, promos, and planning tips.",
    disclaimer:
      "Commission depends on your Traveloka PH - CPS approval in Involve Asia.",
    ruleMerchantName: "Traveloka PH - CPS",
  },

  //
  // Zataru PH (Accesstrade)
  //
  {
    id: "zataru-ph",
    name: "Zataru PH",
    region: "Philippines · E-commerce (Accesstrade)",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission:
      "CPS % via Accesstrade; depends on category and campaign.",
    categoryFocus: "PH e-commerce catalog (per Accesstrade listing).",
    allowedTrafficNotes:
      "Organic content only; respect Accesstrade’s listed rules on traffic sources.",
    notes:
      "Use for PH-targeted content where Zataru’s catalog matches your niche.",
    disclaimer:
      "Commission depends on your Zataru PH approval in Accesstrade.",
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
