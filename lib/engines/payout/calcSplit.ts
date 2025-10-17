// lib/engines/payout/calcSplit.ts

/**
 * calcSplit()
 * --------------------------
 * This is the single source of truth for commission splits in Linkmint.
 *
 * Base Rule:
 *   - Invitee (earner): 85%
 *   - Platform (Linkmint): 15%
 *
 * Referral Bonus Rule:
 *   - If the referrer has an active 90-day window for this invitee:
 *       Invitee: 80%
 *       Referrer: 5%
 *       Platform: 15%
 *
 * The 5% bonus always comes from the invitee’s share,
 * so Linkmint’s 15% margin is never reduced.
 *
 * This file contains no database logic — it only performs math
 * and is called by payout engines or commission processors.
 */

export function calcSplit({
  grossCents,
  isReferralActive,
}: {
  /** total commission value in cents */
  grossCents: number;
  /** whether the referrer’s 90-day window is active for this invitee */
  isReferralActive: boolean;
}): {
  inviteeCents: number;
  referrerCents: number;
  platformCents: number;
  appliedReferralBonus: boolean;
} {
  // Guard: zero or negative commission
  if (grossCents <= 0) {
    return {
      inviteeCents: 0,
      referrerCents: 0,
      platformCents: 0,
      appliedReferralBonus: false,
    };
  }

  // Constants
  const PLATFORM_RATE = 0.15; // Linkmint fixed margin
  const REFERRAL_RATE = 0.05; // 5% bonus from invitee share

  // Step 1 — Base split (85/15)
  const platformCents = Math.floor(grossCents * PLATFORM_RATE);
  let inviteeCents = grossCents - platformCents;
  let referrerCents = 0;
  let appliedReferralBonus = false;

  // Step 2 — Apply referral window adjustment
  if (isReferralActive) {
    const referral = Math.floor(grossCents * REFERRAL_RATE);
    inviteeCents = Math.max(0, inviteeCents - referral);
    referrerCents = referral;
    appliedReferralBonus = true;
  }

  // Step 3 — Return computed split
  return {
    inviteeCents,
    referrerCents,
    platformCents,
    appliedReferralBonus,
  };
}
