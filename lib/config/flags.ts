// lib/config/flags.ts

/**
 * Feature flags for payouts.
 * - AUTO_PAYOUT_ENABLED: enables the engine to auto-create/advance payout rows
 * - AUTO_PAYOUT_DISBURSE_ENABLED: actually hits payment providers (GCash/PayPal/etc.)
 *
 * ENV is the source of truth; admin UI can set in-memory overrides (ephemeral).
 * Overrides reset on server restart/redeploy.
 */

function toBool(v: string | undefined, def = false) {
  if (!v) return def;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

// ENV defaults
const envAutoPayoutEnabled = toBool(process.env.AUTO_PAYOUT_ENABLED, false);
const envAutoDisburseEnabled = toBool(process.env.AUTO_PAYOUT_DISBURSE_ENABLED, false);

// In-memory overrides (ephemeral)
type FlagOverrides = {
  autoPayoutEnabled?: boolean;
  autoPayoutDisburseEnabled?: boolean;
};

// Ensure a single global bag in dev/hot-reload
const GLOBAL_KEY = "__linkmint_flag_overrides__";
const g = globalThis as any;
if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = {} as FlagOverrides;
const overrides: FlagOverrides = g[GLOBAL_KEY];

export const flags = {
  envAutoPayoutEnabled,
  envAutoDisburseEnabled,
  get autoPayoutEnabled() {
    return typeof overrides.autoPayoutEnabled === "boolean"
      ? overrides.autoPayoutEnabled
      : envAutoPayoutEnabled;
  },
  get autoPayoutDisburseEnabled() {
    return typeof overrides.autoPayoutDisburseEnabled === "boolean"
      ? overrides.autoPayoutDisburseEnabled
      : envAutoDisburseEnabled;
  },
} as const;

/** Convenience getters */
export function isAutoPayoutEnabled() {
  return flags.autoPayoutEnabled === true;
}
export function isAutoDisburseEnabled() {
  return flags.autoPayoutDisburseEnabled === true;
}

/** Admin-only: set/clear runtime overrides (pass undefined to clear) */
export function setAutoPayoutEnabledOverride(v: boolean | undefined) {
  overrides.autoPayoutEnabled = v;
}
export function setAutoDisburseEnabledOverride(v: boolean | undefined) {
  overrides.autoPayoutDisburseEnabled = v;
}

/** Snapshot for APIs/UI */
export function readFlagSnapshot() {
  return {
    env: {
      autoPayoutEnabled: envAutoPayoutEnabled,
      autoPayoutDisburseEnabled: envAutoDisburseEnabled,
    },
    overrides: {
      autoPayoutEnabled: overrides.autoPayoutEnabled ?? null,
      autoPayoutDisburseEnabled: overrides.autoPayoutDisburseEnabled ?? null,
    },
    effective: {
      autoPayoutEnabled: isAutoPayoutEnabled(),
      autoPayoutDisburseEnabled: isAutoDisburseEnabled(),
    },
  };
}
