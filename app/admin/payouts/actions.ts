// app/admin/payouts/actions.ts
"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { sendPayPalPayout } from "@/lib/paypal";
import { logEvent } from "@/lib/log/logEvent";

/**
 * Admin-only action: send a single payout via PayPal Payouts.
 * - Guarded by requireAdmin()
 * - Uses payout.id as the idempotency key (lm_<id>)
 * - Updates Payout.statusEnum to PAID on success
 * - Writes EventLog (type="payout") for audit
 *
 * NOTE: v1 supports PAYPAL provider only.
 */
export async function sendPayout(payoutId: string, note?: string) {
  // Ensure caller is an allowed admin
  const { email: adminEmail } = await requireAdmin();

  // Load payout row
  const p = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: {
      id: true,
      userId: true,
      provider: true,
      statusEnum: true,
      netCents: true,
      receiverEmail: true,
      createdAt: true,
    },
  });

  if (!p) throw new Error("Payout not found");
  if (p.provider !== "PAYPAL") throw new Error("Only PayPal supported in this version");
  if (p.statusEnum !== "PENDING") throw new Error(`Payout is not pending (current: ${p.statusEnum})`);
  if (!p.receiverEmail) throw new Error("Missing payout destination (receiverEmail)");

  const amountUSD = (p.netCents ?? 0) / 100;
  if (!Number.isFinite(amountUSD) || amountUSD <= 0) {
    throw new Error("Amount must be > 0");
  }

  // Idempotency key: reuse for retries so PayPal doesn't double-send
  const batchId = `lm_${p.id}`;

  // Call PayPal Payouts API
  const res = await sendPayPalPayout({
    email: p.receiverEmail,
    amountUSD,
    note,
    batchId,
  });

  // Optional references from PayPal (field names vary)
  const payoutBatchId: string | undefined =
    res?.batch_header?.payout_batch_id ?? res?.payout_batch_id ?? undefined;
  const batchStatus: string | undefined =
    res?.batch_header?.batch_status ?? res?.batch_status ?? undefined;

  // Mark as PAID (v1 assumes synchronous success for small volumes)
  await prisma.payout.update({
    where: { id: p.id },
    data: { statusEnum: "PAID" as any },
  });

  // 🔔 Audit log (this shows up in /admin/logs with green "payout" style)
  await logEvent(
    "payout",
    [
      `PAID via PayPal by ${adminEmail}`,
      `payout=${p.id}`,
      `amount=$${amountUSD.toFixed(2)}`,
      p.receiverEmail ? `to=${p.receiverEmail}` : "",
      payoutBatchId ? `batch=${payoutBatchId}` : "",
      batchStatus ? `status=${batchStatus}` : "",
      note ? `note=${note}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    p.userId
  );

  return {
    ok: true,
    payoutId: p.id,
    paypal: {
      batchId: payoutBatchId ?? null,
      status: batchStatus ?? null,
    },
  };
}
