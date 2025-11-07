// app/admin/payouts/ledger/[userId]/csv/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

function esc(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, ctx: { params: { userId: string } }) {
  try {
    const userId = ctx.params.userId;

    // Verify user exists (helps filename + avoids empty CSV for typos)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }

    // Fetch payout requests for this user
    const rows = await prisma.payoutRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        amountPhp: true,
        method: true,
        provider: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        processorNote: true,
        gcashNumber: true,
        bankName: true,
        bankAccountNumber: true,
      },
      take: 1000,
    });

    const headers = [
      "id","userEmail","userId","amountPhp","method","provider","status",
      "requestedAt","processedAt","processorNote","gcashNumber","bankName","bankAccountNumber",
    ];

    const lines = [
      headers.join(","),
      ...rows.map(r =>
        [
          r.id,
          user.email ?? "",
          user.id,
          r.amountPhp,
          r.method,
          r.provider,
          r.status,
          r.requestedAt?.toISOString() ?? "",
          r.processedAt?.toISOString() ?? "",
          r.processorNote ?? "",
          r.gcashNumber ?? "",
          r.bankName ?? "",
          r.bankAccountNumber ?? "",
        ].map(esc).join(",")
      ),
    ];

    const csv = lines.join("\r\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ledger_${user.email || user.id}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Ledger CSV error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
