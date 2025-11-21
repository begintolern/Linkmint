// lib/risk/riskTypes.ts

// Why something was flagged
export type SuspicionReason =
  | "MULTI_ACCOUNT_SAME_DEVICE"
  | "SELF_REFERRAL"
  | "SUSPICIOUS_CLICK_VOLUME"
  | "VPN_OR_PROXY"
  | "RAPID_SIGNUPS_SAME_IP"
  | "UNUSUAL_PURCHASE_PATTERN"
  | "OTHER";

// Basic structure of a risk flag we can attach to a user, payout, or event
export interface RiskFlag {
  id?: string; // optional if we later store in DB
  userId?: string | null;
  relatedUserId?: string | null; // e.g., referrer or friend
  eventType?: "SIGNUP" | "CLICK" | "PURCHASE" | "PAYOUT" | "REFERRAL" | "GENERAL";
  reason: SuspicionReason;
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string; // human-readable explanation for admin
  createdAt?: Date;
  metadata?: Record<string, unknown>; // flexible extra info (ip, device, counts, etc.)
}

// Aggregate view per user (in-memory for now)
export interface UserRiskSummary {
  userId: string;
  riskScore: number; // 0–100 scale
  flags: RiskFlag[];
}
