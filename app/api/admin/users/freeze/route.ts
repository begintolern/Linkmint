// app/api/admin/users/freeze/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

async function sendTelegram(text: string) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN || "";
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || "";
    if (!token || !chatId) return; // silently skip if not configured
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch {
    // do not block action on alert failure
  }
}

export async function POST(req: Request) {
  try {
    // admin auth
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.role || session.user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetId = String(body?.userId || "").trim();
    const reason = String(body?.reason || "").trim();

    if (!targetId) {
      return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });
    }

    // Freeze the user
    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { disabled: true, trustScore: 0 },
      select: { id: true, email: true, name: true, disabled: true },
    });

    // Log a compliance event for audit trail
    try {
      await prisma.complianceEvent.create({
        data: {
          type: "USER_FROZEN",
          message: reason || "Account frozen by admin",
          userId: updated.id,
          severity: 2,
          meta: { adminEmail: session.user.email || null },
        } as any,
      });
    } catch {}

    // Telegram admin alert (non-blocking)
    const adminName = session?.user?.email || "admin";
    await sendTelegram(
      [
        "🧊 <b>User Frozen</b>",
        `• <b>UserID:</b> ${updated.id}`,
        `• <b>Email:</b> ${updated.email || "—"}`,
        `• <b>By:</b> ${adminName}`,
        reason ? `• <b>Reason:</b> ${reason}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    console.error("[admin/users/freeze] error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
