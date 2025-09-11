export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const toNum = (x: any) =>
  x?._sum?.amount?.toNumber ? x._sum.amount.toNumber() : Number(x?._sum?.amount ?? 0);

export async function GET() {
  try {
    const [pending, approved, paid] = await Promise.all([
      prisma.commission.aggregate({ _sum: { amount: true }, where: { status: "Pending" as any } }),
      prisma.commission.aggregate({ _sum: { amount: true }, where: { status: "APPROVED" as any } }),
      prisma.commission.aggregate({ _sum: { amount: true }, where: { status: "Paid" as any } }),
    ]);

    return NextResponse.json({
      pending: toNum(pending),
      approved: toNum(approved),
      paid: toNum(paid),
    });
  } catch (e: any) {
    console.error("payouts/summary error:", e);
    return NextResponse.json({ error: e?.message || "summary failed" }, { status: 500 });
  }
}
