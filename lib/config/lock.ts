// lib/config/lock.ts
import { prisma } from "@/lib/db";

/**
 * Lightweight lock using SystemSetting (key-primary).
 * - key: "auto_payout_lock"
 * - value: ISO timestamp or JSON (we use ISO to keep it simple)
 * - ttlMs: how long before we consider the lock stale
 */

const KEY = "auto_payout_lock";

export async function acquireAutoPayoutLock(ttlMs = 60_000) {
  const now = Date.now();
  const iso = new Date(now).toISOString();
  const ttlCutoff = now - ttlMs;

  const existing = await prisma.systemSetting.findUnique({ where: { key: KEY } });
  if (existing) {
    const t = Date.parse(existing.value || "");
    if (!Number.isNaN(t) && t > ttlCutoff) {
      return { ok: false, reason: "locked", at: existing.value };
    }
    // stale lock -> overwrite below
  }

  await prisma.systemSetting.upsert({
    where: { key: KEY },
    update: { value: iso },
    create: { key: KEY, value: iso },
  });

  return { ok: true, at: iso };
}

export async function releaseAutoPayoutLock() {
  await prisma.systemSetting.deleteMany({ where: { key: KEY } });
  return { ok: true };
}

export async function peekAutoPayoutLock() {
  const existing = await prisma.systemSetting.findUnique({ where: { key: KEY } });
  if (!existing) return { locked: false };
  return { locked: true, at: existing.value };
}

export async function forceUnlockAutoPayout() {
  await prisma.systemSetting.deleteMany({ where: { key: KEY } });
  return { ok: true };
}
