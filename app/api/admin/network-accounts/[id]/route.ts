// app/api/admin/network-accounts/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const account = await prisma.networkAccount.findUnique({ where: { id: params.id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, account });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const updated = await prisma.networkAccount.update({
      where: { id: params.id },
      data: {
        ...(body.network === undefined ? {} : { network: body.network }),
        ...(body.accountId === undefined ? {} : { accountId: String(body.accountId) }),
        ...(body.note === undefined ? {} : { note: body.note }),
      },
    });
    return NextResponse.json({ success: true, account: updated });
  } catch (e: any) {
    console.error("Update NetworkAccount failed:", e?.message || e);
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await prisma.networkAccount.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
