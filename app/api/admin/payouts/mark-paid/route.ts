// app/api/admin/payouts/mark-paid/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PayoutStatus } from "@prisma/client";
import { cookies, headers } from "next/headers";

function isAdminRequest() {
  const admin = (process.env.ADMIN_API_KEY || "").trim();
  const c = (cookies().get("admin_key")?.value || "").trim();
  const h = (headers().get("x-admin-key") || "").trim();
  return !!admin && (c === admin || h === admin);
}

// GET …/mark-paid?id=...&note=...
export async function GET(req: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const note = (url.searchParams.get("note") || "").trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }
  try {
    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: PayoutStatus.PAID,
        processedAt: new Date(),
        processorNote: note || "Marked paid via admin UI",
        provider: "MANUAL",
      },
    });
    return NextResponse.json({ ok: true, payoutRequest: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Update failed" }, { status: 500 });
  }
}

// POST JSON { id, note? }
export async function POST(req: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const id = (body?.id || "").trim();
  const note = (body?.note || "").trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }
  try {
    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: PayoutStatus.PAID,
        processedAt: new Date(),
        processorNote: note || "Marked paid via admin UI",
        provider: "MANUAL",
      },
    });
    return NextResponse.json({ ok: true, payoutRequest: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Update failed" }, { status: 500 });
  }
}
