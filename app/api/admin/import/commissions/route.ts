// app/api/admin/import/commissions/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

type ImportRow = {
  userEmail: string;   // required to attribute commission
  amount: number;      // gross commission amount
  status?: string;     // "Pending" | "Approved" | "Paid"
  orderId?: string;
  merchant?: string;
  network?: string;
  occurredAt?: string; // ISO date
};

function parseCsv(text: string): ImportRow[] {
  // Simple CSV parser (expects header). Commas only; no quotes/escapes support.
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const rec: any = {};
    header.forEach((key, idx) => {
      rec[key] = cols[idx];
    });
    rows.push({
      userEmail: String(rec.userEmail || rec.email || "").toLowerCase(),
      amount: Number(rec.amount ?? 0),
      status: rec.status ?? "Pending",
      orderId: rec.orderId ?? undefined,
      merchant: rec.merchant ?? undefined,
      network: rec.network ?? undefined,
      occurredAt: rec.occurredAt ?? undefined,
    });
  }
  return rows;
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    // Support CSV (text/plain or text/csv) and JSON
    const contentType = req.headers.get("content-type") || "";
    let rows: ImportRow[] = [];

    if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      const text = await req.text();
      rows = parseCsv(text);
    } else {
      const json = await req.json();
      rows = Array.isArray(json) ? json : json?.rows ?? [];
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "No rows to import." }, { status: 400 });
    }

    let imported = 0;
    const errors: Array<{ row: any; error: string }> = [];

    for (const r of rows) {
      try {
        if (!r.userEmail || !r.amount) {
          errors.push({ row: r, error: "Missing userEmail or amount" });
          continue;
        }
        const user = await prisma.user.findUnique({ where: { email: r.userEmail } });
        if (!user) {
          errors.push({ row: r, error: "User not found" });
          continue;
        }

        const status = String(r.status ?? "Pending");
        const occurredAt = r.occurredAt ? new Date(r.occurredAt) : new Date();

        await prisma.commission.create({
          data: {
            userId: user.id,
            amount: r.amount as any, // Decimal-compatible
            status,                  // "Pending" | "Approved" | "Paid"
            paidOut: status.toLowerCase() === "paid",
            orderId: r.orderId ?? null,
            merchant: r.merchant ?? null,
            network: r.network ?? null,
            createdAt: occurredAt,
          } as any,
        });

        imported++;
      } catch (e: any) {
        errors.push({ row: r, error: e?.message || "Unknown error" });
      }
    }

    return NextResponse.json({ success: true, imported, errors });
  } catch (e: any) {
    console.error("Import commissions failed:", e?.message || e);
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}
