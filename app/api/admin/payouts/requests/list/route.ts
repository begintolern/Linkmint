// app/api/admin/payouts/requests/list/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies, headers } from "next/headers";
import { PayoutStatus } from "@prisma/client";

function isAdminRequest() {
  const admin = (process.env.ADMIN_API_KEY || "").trim();
  const c = (cookies().get("admin_key")?.value || "").trim();
  const h = (headers().get("x-admin-key") || "").trim();
  return !!admin && (c === admin || h === admin);
}

export async function GET(req: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const statusParam = (url.searchParams.get("status") || "PENDING").toUpperCase() as keyof typeof PayoutStatus;
  const status = PayoutStatus[statusParam] ?? PayoutStatus.PENDING;

  // Date range filters (ISO yyyy-mm-dd or ISO with time)
  // By default:
  // - For PENDING/PROCESSING: filter by requestedAt
  // - For PAID/FAILED:        filter by processedAt (when available)
  const fromStr = url.searchParams.get("from")?.trim() || null;
  const toStr = url.searchParams.get("to")?.trim() || null;

  const from = fromStr ? new Date(fromStr) : null;
  // `to` is inclusive by day if only a date is given — add 1 day
  let to: Date | null = null;
  if (toStr) {
    const t = new Date(toStr);
    if (!isNaN(t.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(toStr)) {
        // date-only => include entire day
        t.setDate(t.getDate() + 1);
      }
      to = t;
    }
  }

  const useProcessed = status === PayoutStatus.PAID || status === PayoutStatus.FAILED;
  const dateField = useProcessed ? "processedAt" : "requestedAt";

  const dateFilter: any = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lt = to;

  const where: any = { status };
  if (from || to) where[dateField] = dateFilter;

  const orderBy =
    status === PayoutStatus.PAID
      ? { processedAt: "desc" as const }
      : { requestedAt: "desc" as const };

  const rows = await prisma.payoutRequest.findMany({
    where,
    orderBy,
    select: {
      id: true,
      userId: true,
      amountPhp: true,
      method: true,
      status: true,
      requestedAt: true,
      processedAt: true,
      processorNote: true,
      gcashNumber: true,
      bankName: true,
      bankAccountNumber: true,
      user: { select: { email: true } }, // 👈 include user email
    },
    take: 200,
  });

  // flatten user.email → userEmail for simpler client code
  const items = rows.map((r) => ({
    ...r,
    userEmail: r.user?.email ?? null,
    user: undefined as any,
  }));

  return NextResponse.json({ ok: true, count: items.length, items });
}
