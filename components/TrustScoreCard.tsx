'use client';

import { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface TrustScoreCardProps {
  trustScore: number;
}

const TrustScoreCard: FC<TrustScoreCardProps> = ({ trustScore }) => {
  const tier = trustScore >= 85 ? 'Gold' : trustScore >= 70 ? 'Silver' : 'Bronze';
  const tierColor =
    tier === 'Gold' ? 'bg-yellow-500' : tier === 'Silver' ? 'bg-gray-400' : 'bg-orange-300';

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h2 className="text-xl font-semibold">🔐 TrustScore Overview</h2>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 text-white rounded-full text-sm ${tierColor}`}>
            {tier} Tier
          </div>
          <span className="text-gray-700 font-mono">Score: {trustScore}/100</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrustScoreCard;
