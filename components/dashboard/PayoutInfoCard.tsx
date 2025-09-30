// components/dashboard/PayoutInfoCard.tsx
import React from "react";

type Props = {
  approvedTotal: number;
  threshold: number;
};

export default function PayoutInfoCard({ approvedTotal, threshold }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payout Summary</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500">Approved total</div>
          <div className="font-medium">${approvedTotal.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">Minimum to withdraw</div>
          <div className="font-medium">${threshold.toFixed(2)}</div>
        </div>
      </div>

      <div className="rounded-xl border bg-gray-50 text-gray-700 text-sm p-3">
        <div className="font-medium">Tax notice</div>
        <p className="mt-1">
          You’re responsible for any taxes on your earnings. We may collect a W-9/W-8,
          issue required forms (e.g., 1099-NEC), and withhold or delay payouts if required by law.
        </p>
      </div>
    </div>
  );
}
