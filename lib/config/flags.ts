// lib/config/flags.ts
/**
 * Payout feature flags + safety knobs (with in-memory overrides).
 * Effective values = overrides ?? env.
 *
 * ENV (defaults):
 * - AUTO_PAYOUT_ENABLED
 * - AUTO_PAYOUT_DISBURSE_ENABLED
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
  return new Set(v.split(",").map((s) => s.trim()).filter(Boolean));
}
function setToCsv(s: Set<string>) {
  return Array.from(s).join(",");
}

// ——— ENV SNAPSHOT ———
const envSnapshot = {
  autoPayoutEnabled: toBool(process.env.AUTO_PAYOUT_ENABLED, false),
  autoPayoutDisburseEnabled: toBool(process.env.AUTO_PAYOUT_DISBURSE_ENABLED, false),
  autoPayoutBatchLimit: toInt(process.env.AUTO_PAYOUT_BATCH_LIMIT, 20),
  autoPayoutAllowlistCsv: process.env.AUTO_PAYOUT_ALLOWLIST || "",
};

// ——— IN-MEMORY OVERRIDES ———
const overrides: {
  autoPayoutEnabled?: boolean;
  autoPayoutDisburseEnabled?: boolean;
  autoPayoutBatchLimit?: number;
  autoPayoutAllowlist?: Set<string>;
} = {};

// ——— EFFECTIVE GETTERS (preferred by engine/routes/UI) ———
export async function isAutoPayoutEnabled() {
  return overrides.autoPayoutEnabled ?? envSnapshot.autoPayoutEnabled;
}
export async function isAutoDisburseEnabled() {
  return overrides.autoPayoutDisburseEnabled ?? envSnapshot.autoPayoutDisburseEnabled;
}
export function getAutoBatchLimit() {
  return overrides.autoPayoutBatchLimit ?? envSnapshot.autoPayoutBatchLimit;
}
export function getAutoAllowlist() {
  return overrides.autoPayoutAllowlist ?? parseCsvSet(envSnapshot.autoPayoutAllowlistCsv);
}

// ——— SNAPSHOT (for admin UI) ———
export function readFlagSnapshot() {
  const env = {
    autoPayoutEnabled: envSnapshot.autoPayoutEnabled,
    autoPayoutDisburseEnabled: envSnapshot.autoPayoutDisburseEnabled,
    autoPayoutBatchLimit: envSnapshot.autoPayoutBatchLimit,
    autoPayoutAllowlistCsv: envSnapshot.autoPayoutAllowlistCsv,
  };
  const ov = {
    autoPayoutEnabled: overrides.autoPayoutEnabled ?? null,
    autoPayoutDisburseEnabled: overrides.autoPayoutDisburseEnabled ?? null,
    autoPayoutBatchLimit: overrides.autoPayoutBatchLimit ?? null,
    autoPayoutAllowlistCsv: overrides.autoPayoutAllowlist ? setToCsv(overrides.autoPayoutAllowlist) : null,
  };
  const effective = {
    autoPayoutEnabled: overrides.autoPayoutEnabled ?? env.autoPayoutEnabled,
    autoPayoutDisburseEnabled: overrides.autoPayoutDisburseEnabled ?? env.autoPayoutDisburseEnabled,
    autoPayoutBatchLimit: overrides.autoPayoutBatchLimit ?? env.autoPayoutBatchLimit,
    autoPayoutAllowlistCsv: overrides.autoPayoutAllowlist ? setToCsv(overrides.autoPayoutAllowlist) : env.autoPayoutAllowlistCsv,
  };
  return { env, overrides: ov, effective };
}

// ——— SETTERS (used by admin API) ———
export function setAutoPayoutEnabled(v: boolean | null | undefined) {
  if (typeof v === "boolean") overrides.autoPayoutEnabled = v;
  return readFlagSnapshot();
}
export function setAutoDisburseEnabled(v: boolean | null | undefined) {
  if (typeof v === "boolean") overrides.autoPayoutDisburseEnabled = v;
  return readFlagSnapshot();
}
export function setAutoBatchLimit(v: number | null | undefined) {
  if (typeof v === "number" && Number.isFinite(v) && v > 0 && v <= 1000) {
    overrides.autoPayoutBatchLimit = Math.floor(v);
  }
  return readFlagSnapshot();
}
export function setAutoAllowlistCsv(csv: string | null | undefined) {
  if (typeof csv === "string") {
    overrides.autoPayoutAllowlist = parseCsvSet(csv);
  }
  return readFlagSnapshot();
}
