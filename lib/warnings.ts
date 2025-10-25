// lib/warnings.ts
import type { PrismaClient } from "@prisma/client";

/**
 * PHASE 1 (scaffold only):
 * - Read-only utilities
 * - No writes, no side effects
 * - Safe to import anywhere
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
 * Read-only scan placeholder.
 * For Step 1, this returns an empty list by design.
 * We’ll add specific detectors in later steps.
 */
export async function scanWarnings(
  _prisma: PrismaClient,
  opts: ScanOptions = {}
): Promise<UserWarning[]> {
  void opts; // placeholder, avoids unused param warning
  return [];
}
