// app/api/admin/payout-requests/mark-paid/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function assertAdmin(req: Request) {
  const key = req.headers.get("x-admin-key") || "";
  return !!process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

// fire-and-forget Telegram sender
async function sendTelegram(text: string) {
  try {
    if (!process.env.OPS_ALERTS_ENABLED || String(process.env.OPS_ALERTS_ENABLED) === "0") return;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chat) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        chat_id: chat,
        text,
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // non-blocking
  }
}

export async function POST(req: Request) {
  try {
    if (!assertAdmin(req)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { id, note } = (await req.json().catch(() => ({}))) as {
      id?: string;
      note?: string;
    };
    if (!id) {
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
    }

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: "PAID",
        processedAt: new Date(),
        processorNote: note ?? "Marked PAID by admin",
      },
      select: {
        id: true,
        userId: true,
        amountPhp: true,
        method: true,
        provider: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        processorNote: true,
        user: { select: { email: true } },
      },
    });

    // Telegram alert (green)
    const email = updated.user?.email || updated.userId;
    const msg =
      [
        "🟢 Payout PAID",
        `• Request: ${updated.id}`,
        `• User: ${email}`,
        `• Amount: ₱${updated.amountPhp}`,
        `• Method: ${updated.method} (${updated.provider})`,
        updated.processorNote ? `• Note: ${updated.processorNote}` : null,
        updated.requestedAt ? `• Requested: ${updated.requestedAt.toISOString()}` : null,
        updated.processedAt ? `• Paid: ${updated.processedAt.toISOString()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

    sendTelegram(msg);

    // Optional system log (non-blocking)
    try {
      await prisma.systemLog.create({
        data: {
          id: `payout_paid_${updated.id}`,
          type: "PAYOUT_PAID",
          message: `Payout request marked PAID (${updated.method}/${updated.provider})`,
          json: JSON.stringify({ id: updated.id, userId: updated.userId, amountPhp: updated.amountPhp }),
        },
      });
    } catch {}

    return NextResponse.json({ ok: true, request: updated });
  } catch (e: any) {
    console.error("POST /api/admin/payout-requests/mark-paid error:", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", detail: e?.message }, { status: 500 });
  }
}
