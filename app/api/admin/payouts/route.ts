// app/api/admin/payouts/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Fetch all pending commissions as payouts
export async function GET() {
  try {
    const commissions = await prisma.commission.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      commissions.map(c => ({
        id: c.id,
        userEmail: c.user.email,
        amount: c.amount,
        status: c.status
      }))
    );
  } catch (error) {
    console.error('[GET /api/admin/payouts]', error);
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}

// POST: Mark commission as Paid
export async function POST(req: NextRequest) {
  try {
    const { payoutId } = await req.json();

    if (!payoutId) {
      return NextResponse.json({ error: 'Missing payout ID' }, { status: 400 });
    }

    const updated = await prisma.commission.update({
      where: { id: payoutId },
      data: { status: 'paid' },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('[POST /api/admin/payouts]', error);
    return NextResponse.json({ error: 'Failed to update commission status' }, { status: 500 });
  }
}
