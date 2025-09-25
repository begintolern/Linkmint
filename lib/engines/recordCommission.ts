// lib/engines/recordCommission.ts
import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/compliance/log";

/**
 * Record a commission safely.
 * Falls back gracefully if anything goes wrong.
 */
export async function recordCommission(args: {
  userId: string;
  amount: number;
  type?: string;     // permissive; we coerce to enum at write-time
  source?: string | null;
  description?: string | null;
}) {
  try {
    const commission = await prisma.commission.create({
      // Cast enum fields to any to satisfy Prisma types while we normalize enums app-wide.
      data: {
        userId: args.userId,
        amount: args.amount,
        type: (args.type ?? "GENERIC") as any,  // enum in DB; accept string here
        source: args.source ?? null,
        description: args.description ?? null,
        status: "PENDING" as any,               // enum in DB
      },
    });

    await logEvent({
      type: "COMMISSION_RECORDED",
      severity: 1,
      userId: args.userId,
      message: `Commission recorded: ${args.amount}`,
      meta: { commissionId: commission.id, type: args.type, source: args.source },
    });

    return { ok: true, commission };
  } catch (err: any) {
    console.error("[recordCommission] failed:", err);
    await logEvent({
      type: "COMMISSION_ERROR",
      severity: 3,
      userId: args.userId,
      message: "Failed to record commission",
      meta: { error: String(err), amount: args.amount, type: args.type },
    });
    return { ok: false, error: "COMMISSION_FAILED" };
  }
}

export default recordCommission;
