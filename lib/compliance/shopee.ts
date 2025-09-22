// lib/compliance/shopee.ts
// Centralized Shopee (PH-first) compliance helpers for Linkmint.
// Keep this file framework-agnostic so it can be used by API routes and UI.

/** Channels we currently support in Linkmint UI */
export type TrafficSource =
  | "TikTok"
  | "Instagram"
  | "Facebook"
  | "YouTube"
  | "Blog/Website"
  | "Email (opt-in)"
  | "Search Ads"
  | "Other";

/** Minimal shape we read from MerchantRule to avoid coupling */
export interface MerchantRuleLite {
  id: string;
  merchantName: string;
  market?: string | null;
  domainPattern?: string | null;
  allowedSources?: string[] | null;
  disallowed?: string[] | null;
  cookieWindowDays?: number | null;
  payoutDelayDays?: number | null;
  notes?: string | null;
}

/** Static policy knobs for Shopee (PH baseline) */
export const shopeePolicy = {
  merchantKey: "Shopee",
  market: "PH",
  cookieWindowDays: 7,
  payoutDelayDays: 30,
  disclosureHashtags: ["#ShopeeAffiliate", "#ShopeePartner"],
  semBrandKeywordsBanned: ["shopee", "shope", "shoppe"],
  disallowedPractices: [
    "Forced clicks",
    "Auto-redirects",
    "Popunders",
    "Cookie stuffing",
    "Hidden iframes",
    "Spam groups (piracy/adult/gambling)",
    "Misleading claims or fake discounts",
    "Self-purchase or incentive abuse",
  ],
  // Channels we consider compliant by default
  defaultAllowedSources: [
    "TikTok",
    "Instagram",
    "Facebook",
    "YouTube",
    "Blog/Website",
    "Email (opt-in)",
  ] as TrafficSource[],
};

/**
 * Given a planned distribution (channel + optional ad keywords),
 * produce hard errors and soft warnings to show before link generation.
 */
export function validateShopeeDistribution(input: {
  source: TrafficSource;
  plannedKeywords?: string[]; // only if source === "Search Ads"
}): {
  ok: boolean;
  errors: string[];
  warnings: string[];
  requiredAcknowledgements: string[]; // items user must tick "I agree" for
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredAcknowledgements: string[] = [];

  // Block disallowed source outright
  if (input.source === "Search Ads") {
    // We do not allow brand bidding for Shopee
    const kws = (input.plannedKeywords ?? []).map((k) => k.toLowerCase());
    const bannedHit = kws.some((k) =>
      shopeePolicy.semBrandKeywordsBanned.some((b) => k.includes(b))
    );
    if (bannedHit) {
      errors.push(
        "Search Ads with Shopee brand keywords are not permitted (brand bidding ban)."
      );
    } else {
      // If they insist on Search Ads (non-brand), ask for negation ack
      warnings.push(
        "Search Ads are restricted. You must exclude Shopee brand keywords."
      );
      requiredAcknowledgements.push(
        "I will add negative keywords for 'Shopee' and variations."
      );
    }
  }

  // Generic disallowed practices acknowledgement (always required)
  requiredAcknowledgements.push(
    "I will not use forced clicks, auto-redirects, popunders, hidden iframes, or cookie stuffing."
  );

  // Disclosure reminder (soft requirement we surface in UI)
  warnings.push(
    `Always include a clear affiliate disclosure (e.g., ${shopeePolicy.disclosureHashtags.join(
      " "
    )}).`
  );

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    requiredAcknowledgements,
  };
}

/**
 * Normalize a Shopee product URL to a deep link-able, track-ready URL.
 * NOTE: This does not append network parameters—your link-builder should
 * add the network/affiliate params as provided by Shopee’s program.
 */
export function normalizeShopeeUrl(rawUrl: string): {
  ok: boolean;
  url: string;
  reason?: string;
} {
  try {
    const u = new URL(rawUrl);
    // Accept only Shopee PH for now (extend with other TLDs as needed)
    const host = u.hostname.toLowerCase();
    if (!/(^|\.)shopee\.ph$/.test(host)) {
      return {
        ok: false,
        url: rawUrl,
        reason: "Not a Shopee PH URL (shopee.ph required).",
      };
    }

    // Remove tracking junk we don’t control; keep path and essential params
    const clean = new URL(`https://${host}${u.pathname}`);
    // If essential query keys are present (e.g., itemid, shopid), preserve them
    const keepKeys = ["itemid", "shopid", "sp_atk", "smtt"];
    for (const [k, v] of u.searchParams.entries()) {
      if (keepKeys.includes(k.toLowerCase())) clean.searchParams.set(k, v);
    }

    return { ok: true, url: clean.toString() };
  } catch {
    return { ok: false, url: rawUrl, reason: "Invalid URL format." };
  }
}

/**
 * High-level helper to produce a single object your UI/API can consume.
 * It merges rule hints from DB with our static policy so we can render
 * a one-shot “Compliance Card” before users copy a Shopee link.
 */
export function getShopeeComplianceCard(rule?: MerchantRuleLite): {
  title: string;
  bullets: string[];
  cookieWindowDays: number;
  payoutDelayDays: number;
  disclosures: string[];
} {
  const cookieWindowDays =
    rule?.cookieWindowDays ?? shopeePolicy.cookieWindowDays;
  const payoutDelayDays =
    rule?.payoutDelayDays ?? shopeePolicy.payoutDelayDays!;
  const disclosures = shopeePolicy.disclosureHashtags;

  const bullets: string[] = [
    `Attribution window: ${cookieWindowDays} days.`,
    `Payout delay: ~${payoutDelayDays} days for cancellations/returns.`,
    "No forced clicks, auto-redirects, hidden iframes, or cookie stuffing.",
    "Do not bid on Shopee brand keywords in ads.",
    `Always disclose affiliate relationship (e.g., ${disclosures.join(" ")}).`,
  ];

  if (rule?.notes) bullets.push(rule.notes);

  return {
    title: "Shopee Compliance",
    bullets,
    cookieWindowDays,
    payoutDelayDays,
    disclosures,
  };
}

/**
 * Lightweight guard to check if a MerchantRule row “looks like” Shopee PH.
 * Use before invoking Shopee-specific enforcement.
 */
export function isShopeePH(rule?: MerchantRuleLite | null): boolean {
  if (!rule) return false;
  const name = (rule.merchantName || "").toLowerCase();
  const market = (rule.market || "").toUpperCase();
  const host = (rule.domainPattern || "").toLowerCase();
  return name.includes("shopee") && market === "PH" && host.includes("shopee.ph");
}

/**
 * Convenience: merge DB-allowed sources with policy defaults for UI pickers.
 */
export function getAllowedSourcesForShopee(rule?: MerchantRuleLite): TrafficSource[] {
  const fromDb = (rule?.allowedSources ?? []).filter(Boolean) as string[];
  const merged = new Set<string>([
    ...shopeePolicy.defaultAllowedSources,
    ...fromDb,
  ]);
  // Only return sources we know about in the union type
  return Array.from(merged).filter((s): s is TrafficSource =>
    [
      "TikTok",
      "Instagram",
      "Facebook",
      "YouTube",
      "Blog/Website",
      "Email (opt-in)",
      "Search Ads",
      "Other",
    ].includes(s)
  );
}
