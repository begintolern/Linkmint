'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

type BonusStatus = {
  hasActiveBonus: boolean;
  activeBatchExpiresAt?: string;
};

export default function ReferralBonusBanner() {
  const [bonus, setBonus] = useState<BonusStatus | null>(null);

  useEffect(() => {
    const fetchBonus = async () => {
      try {
        const res = await fetch('/api/referrals/status');
        const data = await res.json();
        setBonus(data);
      } catch (err) {
        console.error('Error fetching referral bonus:', err);
      }
    };

    fetchBonus();
  }, []);

  if (!bonus?.hasActiveBonus) return null;

  const expiresIn = bonus.activeBatchExpiresAt
    ? Math.ceil(
        (new Date(bonus.activeBatchExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
      <p className="text-sm font-medium text-green-800">
        🎉 You have a 5% referral bonus active!
      </p>
      <p className="text-xs text-green-700">
        Ends in <Badge className="mx-1">{expiresIn} days</Badge> — keep referring to earn more.
      </p>
    </div>
  );
}
