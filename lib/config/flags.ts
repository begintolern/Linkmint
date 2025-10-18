// lib/config/flags.ts
/**
 * Feature flags for payouts (default OFF).
 * - AUTO_PAYOUT_ENABLED: enables the engine to auto-create/advance payout rows
 * - AUTO_PAYOUT_DISBURSE_ENABLED: actually hits payment providers (GCash/PayPal/etc.)
 *
 * Keep both false until you explicitly flip them.
 */

function toBool(v: string | undefined, def = false) {
  if (!v) return def;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export const flags = {
  autoPayoutEnabled: toBool(process.env.AUTO_PAYOUT_ENABLED, false),
  autoPayoutDisburseEnabled: toBool(process.env.AUTO_PAYOUT_DISBURSE_ENABLED, false),
} as const;

/** Convenience getters (for clearer call sites) */
export function isAutoPayoutEnabled() {
  return flags.autoPayoutEnabled === true;
}

export function isAutoDisburseEnabled() {
  return flags.autoPayoutDisburseEnabled === true;
}
/** Useful for APIs to show flag state */
export function readFlagSnapshot() {
  return {
    env: {
      autoPayoutEnabled: process.env.AUTO_PAYOUT_ENABLED === "true",
      autoPayoutDisburseEnabled: process.env.AUTO_PAYOUT_DISBURSE_ENABLED === "true",
    },
    effective: {
      autoPayoutEnabled: process.env.AUTO_PAYOUT_ENABLED === "true",
      autoPayoutDisburseEnabled: process.env.AUTO_PAYOUT_DISBURSE_ENABLED === "true",
    },
    overrides: {
      autoPayoutEnabled: null,
      autoPayoutDisburseEnabled: null,
    },
  };
}
