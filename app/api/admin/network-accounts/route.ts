// app/api/admin/network-accounts/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const accounts = await prisma.networkAccount.findMany({
    orderBy: [{ network: "asc" }, { accountId: "asc" }],
  });
  return NextResponse.json({ success: true, accounts });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const account = await prisma.networkAccount.create({
      data: {
        network: body.network, // enum
        accountId: String(body.accountId ?? ""),
        note: body.note ?? null,
      },
    });
    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (e: any) {
    console.error("Create NetworkAccount failed:", e?.message || e);
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}
