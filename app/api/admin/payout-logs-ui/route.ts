// app/api/admin/payout-logs-ui/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const logs = await prisma.payout.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      userId: true,
      details: true,
      approvedAt: true,
      paidAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, logs });
}
