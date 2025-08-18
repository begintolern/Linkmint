"use client";

import React from "react";

type FounderRewardCardProps = {
  inviterEmail: string | null;
  bonusActive: boolean;
  bonusEndsAt?: string | null; // countdown if active
};

export default function FounderRewardCard({
  inviterEmail,
  bonusActive,
  bonusEndsAt,
}: FounderRewardCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow bg-white dark:bg-gray-900">
      <h2 className="text-xl font-bold mb-2">🎖 Founder Reward</h2>

      {inviterEmail ? (
        <p className="text-gray-700 dark:text-gray-300">
          You were invited by <span className="font-semibold">{inviterEmail}</span>
        </p>
      ) : (
        <p className="text-gray-700 dark:text-gray-300">
          You joined as an original Founder.
        </p>
      )}

      {bonusActive ? (
        <div className="mt-3">
          <p className="text-green-600 font-semibold">✅ 5% Founder Bonus Active</p>
          {bonusEndsAt && (
            <p className="text-sm text-gray-500">
              Bonus ends on {new Date(bonusEndsAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-yellow-600 font-medium">⚠ No active founder bonus</p>
      )}
    </div>
  );
}
