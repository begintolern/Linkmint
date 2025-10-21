// lib/log/policyCheck.ts
import { prisma } from "@/lib/db";
import type { PolicySeverity } from "@prisma/client";

export type PolicyCheckLogInput = {
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;

  inputChars: number;            // length of scanned text
  engine: string;                // e.g., "LLM + heuristics"
  severity: PolicySeverity;      // "NONE" | "LOW" | "MEDIUM" | "HIGH"
  categories: string[];          // e.g., ["GiftCards","CouponStacking"]
  findings?: unknown;            // structured notes
  rawResult?: unknown;           // full result blob shown in UI
  sampleText?: string | null;    // first 2KB of the text checked (optional)
};

export async function logPolicyCheck(input: PolicyCheckLogInput) {
  // Guard & trim to keep rows compact
  const safeSample =
    input.sampleText && input.sampleText.length > 2000
      ? input.sampleText.slice(0, 2000)
      : input.sampleText ?? null;

  return prisma.policyCheckLog.create({
    data: {
      userId: input.userId ?? undefined,
      ip: input.ip ?? undefined,
      userAgent: input.userAgent ?? undefined,

      inputChars: input.inputChars,
      engine: input.engine,
      severity: input.severity,
      categories: input.categories,
      findings: (input.findings ?? null) as any,
      rawResult: (input.rawResult ?? null) as any,
      sampleText: safeSample,
    },
  });
}
