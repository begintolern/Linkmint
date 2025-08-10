// app/api/admin/merchant-rules/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rule = await prisma.merchantRule.findUnique({ where: { id: params.id } });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, rule });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const updated = await prisma.merchantRule.update({
      where: { id: params.id },
      data: {
        ...(body.active === undefined ? {} : { active: !!body.active }),
        ...(body.merchantName === undefined ? {} : { merchantName: String(body.merchantName) }),
        ...(body.network === undefined ? {} : { network: body.network }),
        ...(body.domainPattern === undefined ? {} : { domainPattern: String(body.domainPattern) }),
        ...(body.paramKey === undefined ? {} : { paramKey: String(body.paramKey) }),
        ...(body.paramValue === undefined ? {} : { paramValue: String(body.paramValue) }),
        ...(body.linkTemplate === undefined ? {} : { linkTemplate: body.linkTemplate }),
        ...(body.allowedSources === undefined ? {} : { allowedSources: body.allowedSources }),
        ...(body.disallowed === undefined ? {} : { disallowed: body.disallowed }),
        ...(body.cookieWindowDays === undefined ? {} : { cookieWindowDays: body.cookieWindowDays }),
        ...(body.payoutDelayDays === undefined ? {} : { payoutDelayDays: body.payoutDelayDays }),
        ...(body.commissionType === undefined ? {} : { commissionType: body.commissionType }),
        ...(body.commissionRate === undefined ? {} : { commissionRate: body.commissionRate }),
        ...(body.importMethod === undefined ? {} : { importMethod: body.importMethod }),
        ...(body.apiBaseUrl === undefined ? {} : { apiBaseUrl: body.apiBaseUrl }),
        ...(body.apiAuthType === undefined ? {} : { apiAuthType: body.apiAuthType }),
        ...(body.apiKeyRef === undefined ? {} : { apiKeyRef: body.apiKeyRef }),
        ...(body.notes === undefined ? {} : { notes: body.notes }),
      },
    });

    return NextResponse.json({ success: true, rule: updated });
  } catch (e: any) {
    console.error("Update MerchantRule failed:", e?.message || e);
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await prisma.merchantRule.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
