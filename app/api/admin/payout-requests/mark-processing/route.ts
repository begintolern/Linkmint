// app/api/admin/payout-requests/mark-processing/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function assertAdmin(req: Request) {
  const key = req.headers.get("x-admin-key") || "";
  return !!process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

// tiny inline sender (keeps this step self-contained)
async function sendTelegram(text: string) {
  try {
    if (!process.env.OPS_ALERTS_ENABLED) return;
    if (String(process.env.OPS_ALERTS_ENABLED) === "0") return;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chat) return;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        chat_id: chat,
        text,
        // no parse_mode — keep plain text for safety
        disable_web_page_preview: true,
      }),
    });
  } catch (_) {
    // non-blocking; ignore alert errors
  }
}

export async function POST(req: Request) {
  try {
    if (!assertAdmin(req)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { id, note } = (await req.json().catch(() => ({}))) as { id?: string; note?: string };
    if (!id) {
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
    }

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: "PROCESSING",
        processedAt: new Date(),
        processorNote: note ?? "Marked PROCESSING by admin",
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

    // fire-and-forget Telegram
    const email = updated.user?.email || updated.userId;
    const msg =
      [
        "🔶 Payout PROCESSING",
        `• Request: ${updated.id}`,
        `• User: ${email}`,
        `• Amount: ₱${updated.amountPhp}`,
        `• Method: ${updated.method} (${updated.provider})`,
        updated.processorNote ? `• Note: ${updated.processorNote}` : null,
        updated.requestedAt ? `• Requested: ${updated.requestedAt.toISOString()}` : null,
        updated.processedAt ? `• Changed: ${updated.processedAt.toISOString()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

    sendTelegram(msg);

    return NextResponse.json({ ok: true, request: updated });
  } catch (e: any) {
    console.error("POST /admin/payout-requests/mark-processing error:", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", detail: e?.message }, { status: 500 });
  }
}
