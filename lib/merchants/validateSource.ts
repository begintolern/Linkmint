export type SourceCheckResult =
  | { ok: true }
  | { ok: false; reason: string };

export function normalizeSource(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/**
 * merchant: a DB row (or DTO) that may have allowedSources / disallowedSources
 * source: e.g., "tiktok", "instagram", "facebook", "youtube", "email", "paid search"
 */
export function validateSource(
  merchant: {
    merchantName: string;
    allowedSources?: unknown;
    disallowedSources?: unknown;
  },
  source: string
): SourceCheckResult {
  const src = normalizeSource(source);
  if (!src) return { ok: false, reason: "Missing source" };

  // Coerce lists into lowercased sets
  const toSet = (v: unknown): Set<string> => {
    if (Array.isArray(v)) {
      return new Set(
        v
          .map((x) =>
            typeof x === "string" ? x : (x == null ? "" : String(x))
          )
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean)
      );
    }
    if (typeof v === "string") {
      return new Set(
        v
          .split(",")
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean)
      );
    }
    return new Set();
  };

  const allowed = toSet((merchant as any).allowedSources);
  const disallowed = toSet((merchant as any).disallowedSources);

  // If explicitly disallowed → block
  if (disallowed.has(src)) {
    return {
      ok: false,
      reason: `${merchant.merchantName}: the source "${source}" is not allowed by the merchant's program rules.`,
    };
  }

  // If there is an allowlist defined and source is not in it → block
  if (allowed.size > 0 && !allowed.has(src)) {
    return {
      ok: false,
      reason: `${merchant.merchantName}: the source "${source}" is not in the allowed sources.`,
    };
  }

  return { ok: true };
}
