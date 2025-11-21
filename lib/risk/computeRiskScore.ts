// lib/risk/computeRiskScore.ts

import type { RiskFlag, UserRiskSummary } from "./riskTypes";

/**
 * Simple risk score computation.
 * This DOES NOT talk to the database or any API.
 * It only converts risk flags into a 0–100 score.
 */
export function computeRiskScore(flags: RiskFlag[]): number {
  if (!flags.length) return 0;

  let score = 0;

  for (const flag of flags) {
    switch (flag.severity) {
      case "HIGH":
        score += 40;
        break;
      case "MEDIUM":
        score += 20;
        break;
      case "LOW":
        score += 10;
        break;
      default:
        score += 5;
        break;
    }
  }

  // Cap at 100
  if (score > 100) score = 100;

  return score;
}

/**
 * Build a UserRiskSummary from a list of flags for a specific user.
 * Still pure; no DB calls.
 */
export function buildUserRiskSummary(userId: string, flags: RiskFlag[]): UserRiskSummary {
  const userFlags = flags.filter((f) => f.userId === userId);
  return {
    userId,
    riskScore: computeRiskScore(userFlags),
    flags: userFlags,
  };
}
