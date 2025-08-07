export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from 'next/server';
import { evaluateReferralBadges } from '@/lib/referrals/evaluateReferralBadges';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('linkmint_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const badge = await evaluateReferralBadges(token);
  return NextResponse.json({ message: 'Badge evaluated', badge });
}
