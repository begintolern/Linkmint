import { NextResponse } from "next/server";
import { PrismaClient, PayoutMethod, PayoutProvider, PayoutStatus } from "@prisma/client";
import { sendAlert } from "@/lib/telegram/sendAlert";
import { logPayoutEvent } from "@/lib/audit/logPayoutEvent";

const prisma = new PrismaClient();

// TEMP AUTH — for dev/testing
async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const fromHeader = req.headers.get("x-user-id");
  if (fromHeader && fromHeader.trim().length > 0) return fromHeader.trim();

  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;)\s*userId=([^;]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);

  return null;
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amountPhp, method, gcashNumber, bankName, bankAccountNumber } = body ?? {};

    // Basic input validation
    if (!Number.isInteger(amountPhp) || amountPhp < 500) {
      return NextResponse.json(
        { error: "Minimum payout is ₱500 (amountPhp must be an integer)" },
        { status: 400 }
      );
    }

    if (method !== "GCASH" && method !== "BANK") {
      return NextResponse.json({ error: "method must be 'GCASH' or 'BANK'" }, { status: 400 });
    }

    if (method === "GCASH") {
      if (!gcashNumber || typeof gcashNumber !== "string" || gcashNumber.length !== 11) {
        return NextResponse.json(
          { error: "Valid gcashNumber (11 digits) is required for GCASH payouts" },
          { status: 400 }
        );
      }
    } else if (method === "BANK") {
      if (!bankName || !bankAccountNumber) {
        return NextResponse.json(
          { error: "bankName and bankAccountNumber are required for BANK payouts" },
          { status: 400 }
        );
      }
    }

    // Fetch user for alert context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create payout request
    const created = await prisma.payoutRequest.create({
      data: {
        userId,
        amountPhp,
        method: method as PayoutMethod,
        gcashNumber: method === "GCASH" ? gcashNumber : null,
        bankName: method === "BANK" ? bankName : null,
        bankAccountNumber: method === "BANK" ? bankAccountNumber : null,
        status: PayoutStatus.PENDING,
        provider: PayoutProvider.MANUAL,
      },
      select: {
        id: true,
        amountPhp: true,
        method: true,
        status: true,
        provider: true,
        requestedAt: true,
      },
    });

    // 🔹 Log payout request
    await logPayoutEvent(prisma, {
      userId,
      payoutRequestId: created.id,
      type: "PAYOUT_REQUESTED",
      message: `Payout requested for ₱${created.amountPhp} via ${created.method}`,
      severity: 1,
    });

    // 🔹 Send Telegram alert (best-effort)
    await sendAlert(
      `💸 *New Payout Request*\n\n👤 ${user.email}\n₱${created.amountPhp.toLocaleString()} via ${created.method}\n\nID: \`${created.id}\``
    ).catch((err) => console.warn("Telegram alert error:", err));

    return NextResponse.json({ ok: true, payoutRequest: created }, { status: 201 });
  } catch (err: any) {
    console.error("Create payout request error:", err);

    // Log error
    await logPayoutEvent(prisma, {
      type: "PAYOUT_ERROR",
      message: "Error creating payout request",
      severity: 3,
      meta: { error: err?.message },
    });

    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
