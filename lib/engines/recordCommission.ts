// lib/engines/recordCommission.ts
import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/compliance/log";

/**
 * Telegram alert for commission creation.
 * Safe, silent on failure, no extra imports required.
 */
async function sendTelegramCommissionAlert(commission: any) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      // Telegram not configured; skip
      return;
    }

    const amount =
      commission?.amount ??
      commission?.userAmount ??
      commission?.grossAmount ??
      0;

    const merchant =
      commission?.description ??
      commission?.source ??
      "Unknown merchant";

    const text =
      "🛒 New commission recorded on linkmint.co\n" +
      `User ID: ${commission.userId}\n` +
      `Merchant: ${merchant}\n` +
      `Estimated Commission: ₱${amount}\n` +
      `Commission ID: ${commission.id}`;

    await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      }
    );
  } catch (err) {
    console.error("[telegram][commission] error:", err);
  }
}

/**
 * Record a commission safely.
 * Falls back gracefully if anything goes wrong.
 */
export async function recordCommission(args: {
  userId: string;
  amount: number;
  type?: string;     // permissive; we normalize to enum at write-time
  source?: string | null;
  description?: string | null;
}) {
  try {
    // Normalize incoming type to a valid CommissionType enum
    // Default: referral_purchase (normal purchase commission)
    let normalizedType: "referral_purchase" | "override_bonus" | "payout" =
      "referral_purchase";

    if (args.type === "override_bonus") {
      normalizedType = "override_bonus";
    } else if (args.type === "payout") {
      normalizedType = "payout";
    }

    const commission = await prisma.commission.create({
      data: {
        userId: args.userId,
        amount: args.amount,
        type: normalizedType as any, // enum in DB
        source: args.source ?? null,
        description: args.description ?? null,
        status: "PENDING" as any,    // enum in DB
      },
    });

    // Send Telegram alert *after* creation
    await sendTelegramCommissionAlert(commission);

    // Log the commission event
    await logEvent({
      type: "COMMISSION_RECORDED",
      severity: 1,
      userId: args.userId,
      message: `Commission recorded: ${args.amount}`,
      meta: {
        commissionId: commission.id,
        type: normalizedType,
        source: args.source,
      },
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

    const msg =
      err && err.message
        ? String(err.message)
        : String(err ?? "Unknown commission error");

    return { ok: false, error: msg };
  }
}

export default recordCommission;
