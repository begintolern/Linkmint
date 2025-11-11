import merchantRules from "@/lib/data/merchantRules.json";

export interface SmartLinkResult {
  matchedMerchant?: string;
  affiliateUrl?: string;
  sourceUrl: string;
  country: string;
}

export async function generateSmartLink(sourceUrl: string, country: string): Promise<SmartLinkResult> {
  try {
    const matchedRule = merchantRules.find(
      (rule) =>
        sourceUrl.toLowerCase().includes(rule.merchant.split(" ")[0].toLowerCase()) &&
        rule.country === country &&
        rule.status === "active"
    );

    if (matchedRule) {
      return {
        matchedMerchant: matchedRule.merchant,
        affiliateUrl: matchedRule.baseUrl,
        sourceUrl,
        country
      };
    }

    // fallback: return original link if no match
    return {
      sourceUrl,
      country
    };
  } catch (error) {
    console.error("SmartLinkEngine error:", error);
    return { sourceUrl, country };
  }
}
