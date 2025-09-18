// app/api/merchant-rules/create/route.ts
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  Prisma,
  MerchantRule as DbMerchantRule,
  CommissionCalc,
  ImportMethod,
} from '@prisma/client';

function serialize(m: DbMerchantRule) {
  return {
    ...m,
    commissionRate: m.commissionRate ? Number(m.commissionRate) : null,
    lastImportedAt: m.lastImportedAt ? m.lastImportedAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    allowedSources: m.allowedSources ?? null,
    disallowed: m.disallowed ?? null,
  };
}

// Helper: Prisma expects NullableJsonNullValueInput | InputJsonValue | undefined
function toNullableJsonInput(v: unknown):
  | Prisma.InputJsonValue
  | Prisma.NullableJsonNullValueInput
  | undefined {
  if (typeof v === 'undefined') return undefined; // omit field
  if (v === null) return Prisma.DbNull;           // SQL NULL
  return v as Prisma.InputJsonValue;              // actual JSON value
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    // Required
    const merchantName: string | undefined = body.merchantName;
    if (!merchantName || typeof merchantName !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'merchantName_required' },
        { status: 400 }
      );
    }

    // Optional basics
    const active: boolean = typeof body.active === 'boolean' ? body.active : true;
    const network: string | null = body.network ?? null;
    const domainPattern: string | null = body.domainPattern ?? null;
    const paramKey: string | null = body.paramKey ?? null;
    const paramValue: string | null = body.paramValue ?? null;
    const linkTemplate: string | null = body.linkTemplate ?? null;

    // JSON fields (nullable)
    const allowedSourcesInput = toNullableJsonInput(body.allowedSources);
    const disallowedInput = toNullableJsonInput(body.disallowed);

    // Numbers
    const cookieWindowDays: number | null =
      typeof body.cookieWindowDays === 'number' ? body.cookieWindowDays : null;
    const payoutDelayDays: number | null =
      typeof body.payoutDelayDays === 'number' ? body.payoutDelayDays : null;

    // Enums
    const commissionType =
      body.commissionType === 'PERCENT' || body.commissionType === 'FIXED'
        ? (body.commissionType as CommissionCalc)
        : CommissionCalc.PERCENT;

    const importMethod =
      body.importMethod === 'MANUAL' || body.importMethod === 'API'
        ? (body.importMethod as ImportMethod)
        : ImportMethod.MANUAL;

    // Commission rate (Decimal)
    const commissionRateNum: number | null =
      typeof body.commissionRate === 'number' ? body.commissionRate : null;
    const commissionRate =
      commissionRateNum !== null ? new Prisma.Decimal(commissionRateNum) : null;

    const calc: string | null = body.calc ?? null;
    const rate: number | null = typeof body.rate === 'number' ? body.rate : null;
    const notes: string | null = body.notes ?? null;

    // API meta
    const apiBaseUrl: string | null = body.apiBaseUrl ?? null;
    const apiAuthType: string | null = body.apiAuthType ?? null;
    const apiKeyRef: string | null = body.apiKeyRef ?? null;

    // Status / regions
    const status: string = typeof body.status === 'string' ? body.status : 'PENDING';
    const inactiveReason: string | null = body.inactiveReason ?? null;

    let allowedRegions: string[] = [];
    if (Array.isArray(body.allowedRegions)) {
      allowedRegions = body.allowedRegions.filter((x: any) => typeof x === 'string');
    } else if (typeof body.allowedRegions === 'string') {
      allowedRegions = body.allowedRegions
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    const created = await prisma.merchantRule.create({
      data: {
        active,
        merchantName,
        network,
        domainPattern,
        paramKey,
        paramValue,
        linkTemplate,
        allowedSources: allowedSourcesInput,
        disallowed: disallowedInput,
        cookieWindowDays,
        payoutDelayDays,
        commissionType,
        commissionRate,
        calc,
        rate,
        notes,
        importMethod,
        apiBaseUrl,
        apiAuthType,
        apiKeyRef,
        status,
        allowedRegions,
        inactiveReason,
      },
    });

    return NextResponse.json({ ok: true, merchant: serialize(created) }, { status: 201 });
  } catch (err) {
    console.error('merchant-rules/create POST failed:', err);
    return NextResponse.json({ ok: false, error: 'CREATE_FAILED' }, { status: 500 });
  }
}
