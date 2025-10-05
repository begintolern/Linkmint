import { NextResponse } from "next/server";
import { PrismaClient, PayoutStatus } from "@prisma/client";
import { sendAlert } from "@/lib/telegram/sendAlert";
import { logPayoutEvent } from "@/lib/audit/logPayoutEvent";

const prisma = new PrismaClient();

function isAdmin(req: Request) {
  return req.headers.get("x-admin") === "true";
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { processorNote } = body ?? {};

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: PayoutStatus.PAID,
        processedAt: new Date(),
        processorNote: processorNote ?? null,
      },
      select: {
        id: true,
        userId: true,
        amountPhp: true,
        method: true,
        status: true,
        processedAt: true,
        processorNote: true,
      },
    });

    // Audit log
    await logPayoutEvent(prisma, {
      userId: updated.userId,
      payoutRequestId: updated.id,
      type: "PAYOUT_MARKED_PAID",
      message: `Marked PAID for ₱${updated.amountPhp} via ${updated.method}`,
      severity: 1,
      meta: { processorNote: processorNote ?? null },
    });

    // Telegram alert (best-effort)
    try {
      const full = await prisma.payoutRequest.findUnique({
        where: { id: updated.id },
        include: { user: { select: { email: true } } },
      });
      const email = full?.user?.email ?? "unknown";
      await sendAlert(
        `✅ *Payout Marked PAID*\n\n👤 ${email}\n₱${updated.amountPhp.toLocaleString()} via ${updated.method}\n\nID: \`${updated.id}\`\nNote: ${processorNote ?? "-"}`
      );
    } catch (e) {
      console.warn("Telegram alert (paid) failed:", e);
    }

    return NextResponse.json({ ok: true, payoutRequest: updated });
  } catch (err: any) {
    console.error("Mark paid error:", err);
    await logPayoutEvent(prisma, {
      type: "PAYOUT_ERROR",
      message: "Error marking payout as PAID",
      severity: 3,
      meta: { error: err?.message, id: params.id },
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
