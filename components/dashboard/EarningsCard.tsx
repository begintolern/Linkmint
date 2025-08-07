'use client';

import { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EarningsCardProps {
  userId: string;
}

const EarningsCard: FC<EarningsCardProps> = ({ userId }) => {
  // TEMP TEST: simulate earnings – these will be wired to real data soon
  const totalEarnings = 14.75;
  const pending = 10.20;
  const cleared = 4.55;
  const eligible = cleared >= 5;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h2 className="text-xl font-semibold">💰 Earnings Summary</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <p className="text-gray-500">Total Earnings</p>
          <p className="text-lg font-bold">${totalEarnings.toFixed(2)}</p>
        </div>
        <Badge variant={eligible ? 'success' : 'destructive'}>
          {eligible ? 'Eligible' : 'Not Eligible'}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default EarningsCard;
