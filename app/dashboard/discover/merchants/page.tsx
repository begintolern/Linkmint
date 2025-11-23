// app/dashboard/discover/merchants/page.tsx

import Link from "next/link";
import { prisma } from "@/lib/db";

type MerchantStatus = "live" | "pending" | "coming-soon";

type Merchant = {
  id: string;
  name: string;
  region: string;
  status: MerchantStatus; // base/fallback status
  payoutSpeed: "fast" | "normal" | "slow" | "varies";
  typicalCommission: string;
  categoryFocus: string;
  allowedTrafficNotes: string;
  notes: string;
  disclaimer?: string;
  /**
   * Optional: merchantName as stored in prisma.merchantRule.merchantName
   * Used to match this card to a real rule in Admin.
   */
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
      "Content-based traffic (social posts, organic TikTok, Facebook, IG). Always avoid brand bidding and coupon abuse.",
    notes:
      "Great for everyday sandals, work bags, and neutral “clean girl” looks. Works well with payday and outfit-style content.",
    disclaimer:
      "Actual commission rates and rules depend on the affiliate network and final approved setup. Always confirm inside your affiliate account.",
    ruleMerchantName: "Charles & Keith PH",
  },
  {
    id: "razer-involve-asia",
    name: "Razer (via affiliate networks such as Involve Asia)",
    region: "Philippines + regional · Gaming & peripherals",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission:
      "Tech peripherals range (lower percent, higher ticket price)",
    categoryFocus: "Gaming mice, keyboards, headsets, and accessories",
    allowedTrafficNotes:
      "Organic content, review-style posts, setup tours, and gaming clips usually allowed. Avoid misleading “official” branding.",
    notes:
      "Strong for student gamers and weekend players who want better gear without going full e-sports level. Angle works best when you show real desk setups.",
    disclaimer:
      "Always check the exact Razer merchant entry in your affiliate network for final rules, regions, and rates.",
    ruleMerchantName: "Razer",
  },
  {
    id: "shopee-ph",
    name: "Shopee PH (via approved affiliate programs / networks)",
    region: "Philippines · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission:
      "Varies heavily by seller, category, and campaign (often small but high volume)",
    categoryFocus:
      "Everyday items, home goods, gadgets, fashion, and “TikTok made me buy it” products (including stores like Watsons via Shopee Mall).",
    allowedTrafficNotes:
      "Strong fit for PH users via TikTok, Facebook, Messenger, and group chats. Exact allowed traffic depends on the affiliate program terms.",
    notes:
      "Perfect for “budol” style content, Shopee finds, and payday hauls. Budget-friendly and familiar for Filipino buyers.",
    disclaimer:
      "Rules and payout details are handled by the connected affiliate program (for example, Involve Asia). Always follow Shopee’s and the network’s latest terms.",
    ruleMerchantName: "Shopee PH",
  },
  {
    id: "lazada-ph",
    name: "Lazada PH (via approved affiliate programs / networks)",
    region: "Philippines · Marketplace",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission:
      "Similar to Shopee: small to mid-level per order, but scalable with volume",
    categoryFocus:
      "Home, electronics, fashion, and official flagship stores (including brands like Watsons Official Store when available).",
    allowedTrafficNotes:
      "Commonly used with content-based traffic and social sharing. Rules vary by affiliate program and campaign.",
    notes:
      "Good for bigger-ticket items and branded products. Pairs well with comparison-style content (before/after, upgrade stories).",
    disclaimer:
      "Final rules and payout structure depend on the affiliate setup you’re using to generate links (e.g. Involve Asia).",
    ruleMerchantName: "Lazada PH",
  },
  {
    id: "zalora-ph",
    name: "Zalora PH (via approved affiliate programs / networks)",
    region: "Philippines · Fashion marketplace",
    status: "live",
    payoutSpeed: "normal",
    typicalCommission: "Fashion range (often mid-level % on eligible items)",
    categoryFocus:
      "Fashion, footwear, and accessories with a focus on brand-conscious PH buyers.",
    allowedTrafficNotes:
      "Content and social-driven traffic (IG, TikTok, Facebook) usually a good fit. Avoid spammy posting and coupon abuse.",
    notes:
      "Works well for OOTD content, payday outfits, and “office to weekend” looks. Strong fit for fashion-focused creators.",
    disclaimer:
      "Rates and rules depend on the specific affiliate program connection. Always verify the latest details in your affiliate dashboard.",
    ruleMerchantName: "Zalora PH",
  },
  {
    id: "involve-asia-generic",
    name: "Involve Asia partner merchants (general)",
    region: "Regional · PH, SEA, and beyond",
    status: "live",
    payoutSpeed: "varies",
    typicalCommission:
      "Ranges from very small (low-ticket items) to stronger rates for finance, travel, and higher-value categories",
    categoryFocus:
      "Wide coverage: marketplaces, fashion, tech, finance, travel, and more",
    allowedTrafficNotes:
      "Rules are merchant-specific. Some allow TikTok and social; others are stricter. Always read each merchant’s terms carefully.",
    notes:
      "Involve Asia acts as a hub for many different merchants. Once you’re approved for a merchant inside IA, Linkmint can work with those links as long as you stay compliant.",
    disclaimer:
      "Each merchant inside Involve Asia has its own rules. Linkmint encourages compliant traffic only and does not override official terms.",
    ruleMerchantName: "Involve Asia",
  },
  {
    id: "amazon-global",
    name: "Amazon (global marketplaces, where approved)",
    region: "Global markets · US, EU, etc.",
    status: "pending",
    payoutSpeed: "slow",
    typicalCommission: "Varies by category (many small, long-tail payouts)",
    categoryFocus:
      "Almost everything · good for niche items and global finds, especially for OFW or international audiences.",
    allowedTrafficNotes:
      "Content-based traffic usually allowed; strict about spam, iframe tricks, and unapproved paid ads.",
    notes:
      "Useful when promoting items that are hard to find locally or when targeting OFWs and global audiences. Best for very specific product recommendations.",
    disclaimer:
      "Amazon has strict program rules. This merchant is shown as a planned/target integration. Only use Amazon links where you are personally approved and allowed.",
    ruleMerchantName: "Amazon",
  },
];

function normalizeRuleStatus(raw: unknown): RuleStatus {
  if (raw === "ACTIVE" || raw === "PENDING" || raw === "REJECTED") {
    return raw;
  }
  return "PENDING";
}

function normalizeKey(name: string | null | undefined): string {
  return (name || "").trim().toLowerCase();
}

function asPlainString(x: unknown): string {
  if (x == null) return "—";
  try {
    if (typeof x === "object" && x !== null && "toString" in x) {
      // @ts-ignore - handle Prisma Decimal etc.
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
  // Pull real merchant rules from admin config
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

  // Merge static merchant copy with dynamic status/commission from DB
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
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:py-10">
        <header className="mb-5 sm:mb-6">
          <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Browse merchants
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            This is a high-level overview of merchants and merchant categories
            linkmint.co is designed to work with. Always follow the rules of
            each affiliate program and merchant. Final availability depends on
            approval and network status in your affiliate accounts.
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Tip: Start with merchants that match your{" "}
            <span className="font-semibold text-slate-200">
              content style, audience, and budget
            </span>
            . Then use Discover ideas and the smart link creator to build links
            that feel natural for you and your viewers.
          </p>
        </header>

        {/* Grid of merchant cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {enhancedMerchants.map((m) => (
            <article
              key={m.id}
              className="flex h-full flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-50">
                    {m.name}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(
                      m.status,
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

        <p className="mt-5 text-[10px] text-slate-500">
          All information above is{" "}
          <span className="font-semibold text-slate-300">
            general and AI-assisted
          </span>{" "}
          and does not override any official affiliate program terms. Always
          rely on the official merchant or network documentation for final
          rules, rates, and regional availability.
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
