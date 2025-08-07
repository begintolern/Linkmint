// lib/referralCode.ts

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10);
}
