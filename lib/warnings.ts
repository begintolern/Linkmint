// lib/warnings.ts
import type { PrismaClient } from "@prisma/client";

/**
 * PHASE 1.1: Add a small, read-only detector so scans return real warnings.
 * - Detector implemented: RATE_LIMIT_LINK_CREATION
 * - Heuristic: users who created > RATE_LIMIT_COUNT links within RATE_LIMIT_HOURS
 * - Safe: catches missing models/tables and returns [] in that case
 */

export type WarningType =
  | "SELF_PURCHASE"
  | "DUPLICATE_IP_REFERRAL"
  | "DISALLOWED_PLATFORM"
  | "UNAUTHORIZED_COUPON"
  | "GIFT_CARD_EXCLUDED"
  | "POLICY_PRECHECK_ABUSE"
  | "RATE_LIMIT_LINK_CREATION";

export type UserWarning = {
  userId: string;
  type: WarningType;
  message: string;
  evidence?: Record<string, unknown>;
  createdAt: Date;
};

export type ScanOptions = {
  /** How far back to look for potential signals. */
  lookbackHours?: number;
  /** Cap for any queries we add later. */
  limit?: number;
};

/**
 * Configurable detector thresholds (tune these as needed).
 */
const RATE_LIMIT_HOURS = 1; // lookback window in hours
const RATE_LIMIT_COUNT = 10; // links created in the window considered suspicious
const DEFAULT_LIMIT = 200;

/**
 * Primary scan function — runs lightweight detectors and returns warnings.
 * This function is intentionally conservative and read-only.
 */
export async function scanWarnings(
  prisma: PrismaClient,
  opts: ScanOptions = {}
): Promise<UserWarning[]> {
  const lookbackHours = opts.lookbackHours ?? RATE_LIMIT_HOURS;
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  const results: UserWarning[] = [];

  // Detector: RATE_LIMIT_LINK_CREATION
  // Heuristic: users who created more than RATE_LIMIT_COUNT smart links within lookbackHours
  try {
    // Support common Prisma model names by checking for existence.
    // We try `smartLink` and `SmartLink` (project schemas vary).
    // @ts-ignore
    const model = (prisma as any).smartLink || (prisma as any).SmartLink;

    if (model && typeof model.findMany === "function") {
      // Query recent links grouped by userId (lightweight, capped by `limit`)
      // Using raw query would be fastest but we keep ORM calls for safety.
      // Note: adapt field names if your model uses different property names.
      const recentLinks = await model.findMany({
        where: {
          createdAt: { gte: since },
        },
        select: {
          id: true,
          userId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      // Tally per user
      const counts: Record<string, { count: number; sampleIds: string[] }> = {};
      for (const l of recentLinks) {
        const uid = l.userId ?? l.user_id ?? (l as any).ownerId ?? null;
        if (!uid) continue;
        if (!counts[uid]) counts[uid] = { count: 0, sampleIds: [] };
        counts[uid].count += 1;
        if (counts[uid].sampleIds.length < 5) counts[uid].sampleIds.push(l.id);
      }

      for (const [userId, info] of Object.entries(counts)) {
        if (info.count >= RATE_LIMIT_COUNT) {
          results.push({
            userId,
            type: "RATE_LIMIT_LINK_CREATION",
            message: `Created ${info.count} smart links in the last ${lookbackHours} hour(s).`,
            evidence: {
              count: info.count,
              sampleLinkIds: info.sampleIds,
              windowHours: lookbackHours,
            },
            createdAt: new Date(),
          });
        }
      }
    } else {
      // If model not found, fail silently for this detector.
    }
  } catch (err) {
    // Detector failed — do not throw (keeps scan resilient).
    // eslint-disable-next-line no-console
    console.warn("warnings: rate-limit detector error:", String((err as any)?.message || err));
  }

  // Future detectors (SELF_PURCHASE, DUPLICATE_IP_REFERRAL, etc.) will be added in later steps.
  return results;
}
