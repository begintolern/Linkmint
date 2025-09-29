// app/api/ops/alerts/updates/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!token) return NextResponse.json({ ok: false, error: "NO_TOKEN" }, { status: 400 });

  const url = `https://api.telegram.org/bot${token}/getUpdates`;
  const res = await fetch(url);
  let body: any = null;
  try { body = await res.json(); } catch {}
  return NextResponse.json({ ok: res.ok, status: res.status, body });
}
