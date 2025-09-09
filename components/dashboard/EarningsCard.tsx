'use client';

import { FC, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EarningsCardProps {
  userId: string;
}

interface EarningsSummary {
  pending: number;
  approved: number;
  paid: number;
}

const EarningsCard: FC<EarningsCardProps> = ({ userId }) => {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/user/commissions/summary?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (e) {
        console.error('Failed to load earnings summary', e);
      }
    }
    if (userId) load();
  }, [userId]);

  const total = (summary?.pending || 0) + (summary?.approved || 0) + (summary?.paid || 0);
  const eligible = (summary?.approved || 0) >= 5;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h2 className="text-xl font-semibold">💰 Earnings Summary</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <p className="text-gray-500">Total Earnings</p>
          <p className="text-lg font-bold">${total.toFixed(2)}</p>
        </div>
        <Badge variant={eligible ? 'success' : 'destructive'}>
          {eligible ? 'Eligible' : 'Not Eligible'}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default EarningsCard;
