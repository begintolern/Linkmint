// lib/config/flags.ts
/**
 * Payout feature flags + safety knobs.
 * - AUTO_PAYOUT_ENABLED / AUTO_PAYOUT_DISBURSE_ENABLED
 * - AUTO_PAYOUT_BATCH_LIMIT   (default 20)
 * - AUTO_PAYOUT_ALLOWLIST     (CSV of userIds; empty = no allowlist)
 */
function toBool(v: string | undefined, def = false) {
  if (!v) return def;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}
function toInt(v: string | undefined, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}
function parseCsvSet(v: string | undefined) {
  if (!v) return new Set<string>();
  return new Set(
    v.split(",").map(s => s.trim()).filter(Boolean)
  );
}

export const flags = {
  autoPayoutEnabled: toBool(process.env.AUTO_PAYOUT_ENABLED, false),
  autoPayoutDisburseEnabled: toBool(process.env.AUTO_PAYOUT_DISBURSE_ENABLED, false),
  autoPayoutBatchLimit: toInt(process.env.AUTO_PAYOUT_BATCH_LIMIT, 20),
  autoPayoutAllowlist: parseCsvSet(process.env.AUTO_PAYOUT_ALLOWLIST),
} as const;

export async function isAutoPayoutEnabled() { return flags.autoPayoutEnabled; }
export async function isAutoDisburseEnabled() { return flags.autoPayoutDisburseEnabled; }
export function getAutoBatchLimit() { return flags.autoPayoutBatchLimit; }
export function getAutoAllowlist() { return flags.autoPayoutAllowlist; }
