// lib/admin/log.ts
import { prisma } from "@/lib/db";

export type AdminActor = {
  actorId?: string | null;
  actorEmail?: string | null;
};

/**
 * Write a normalized admin audit log entry.
 * Keep details JSON small/sanitized (no secrets).
 */
export async function logAdminAction(
  actor: AdminActor,
  action: string,
  targetType: string,
  targetId?: string | null,
  details?: unknown
) {
  try {
    await prisma.adminActionLog.create({
      data: {
        actorId: actor.actorId ?? null,
        actorEmail: actor.actorEmail ?? null,
        action,
        targetType,
        targetId: targetId ?? null,
        // Only attach details if provided; helps keep rows lean
        ...(details === undefined ? {} : { details: details as any }),
      },
    });
  } catch (e) {
    // Fail-safe: never throw from auditing; avoid breaking the main action
    console.error("[audit] logAdminAction failed:", e);
  }
}
