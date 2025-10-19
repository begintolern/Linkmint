// lib/config/flags.ts
import { prisma } from "@/lib/db";

/** ENV defaults (fallback if no DB values yet) */
function toBool(v: string | undefined, def = false) {
  if (!v) return def;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}
const envAutoPayoutEnabled = toBool(process.env.AUTO_PAYOUT_ENABLED, false);
const envAutoDisburseEnabled = toBool(process.env.AUTO_PAYOUT_DISBURSE_ENABLED, false);

/** Small server-side cache to reduce DB hits */
type Cache = {
  ts: number;
  data: { autoPayoutEnabled: boolean; autoPayoutDisburseEnabled: boolean };
};
const GLOBAL = globalThis as any;
if (!GLOBAL.__flags_cache) GLOBAL.__flags_cache = null as Cache | null;

async function readFromDB(): Promise<Cache["data"]> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: ["auto_payout_enabled", "auto_payout_disburse_enabled"] } },
  });
  const map = new Map(rows.map(r => [r.key, r.value]));
  return {
    autoPayoutEnabled: map.has("auto_payout_enabled")
      ? map.get("auto_payout_enabled") === "true"
      : envAutoPayoutEnabled,
    autoPayoutDisburseEnabled: map.has("auto_payout_disburse_enabled")
      ? map.get("auto_payout_disburse_enabled") === "true"
      : envAutoDisburseEnabled,
  };
}

async function getCached(): Promise<Cache["data"]> {
  const now = Date.now();
  const cache: Cache | null = GLOBAL.__flags_cache;
  if (cache && now - cache.ts < 15_000) return cache.data; // 15s TTL
  const data = await readFromDB();
  GLOBAL.__flags_cache = { ts: now, data };
  return data;
}

/** Public getters (async) */
export async function isAutoPayoutEnabled(): Promise<boolean> {
  const d = await getCached();
  return d.autoPayoutEnabled;
}
export async function isAutoDisburseEnabled(): Promise<boolean> {
  const d = await getCached();
  return d.autoPayoutDisburseEnabled;
}

/** Admin set/clear (persists to DB) */
export async function setAutoPayoutEnabled(v: boolean) {
  await prisma.systemSetting.upsert({
    where: { key: "auto_payout_enabled" },
    update: { value: v ? "true" : "false" },
    create: { key: "auto_payout_enabled", value: v ? "true" : "false" },
  });
  GLOBAL.__flags_cache = null;
}
export async function setAutoDisburseEnabled(v: boolean) {
  await prisma.systemSetting.upsert({
    where: { key: "auto_payout_disburse_enabled" },
    update: { value: v ? "true" : "false" },
    create: { key: "auto_payout_disburse_enabled", value: v ? "true" : "false" },
  });
  GLOBAL.__flags_cache = null;
}

/** Snapshot for API/UI */
export async function readFlagSnapshot() {
  const d = await getCached();
  return {
    env: {
      autoPayoutEnabled: envAutoPayoutEnabled,
      autoPayoutDisburseEnabled: envAutoDisburseEnabled,
    },
    overrides: {
      autoPayoutEnabled: null,
      autoPayoutDisburseEnabled: null,
    },
    effective: d,
  };
}
