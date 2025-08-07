"use client";

import { useEffect, useState } from "react";

type CommissionData = {
  pending: number;
  approved: number;
  paid: number;
};

export default function CommissionCard() {
  const [data, setData] = useState<CommissionData>({
    pending: 0,
    approved: 0,
    paid: 0,
  });

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const res = await fetch("/api/user/commissions/summary");
        const json = await res.json();
        if (res.ok) {
          setData({
            pending: json.pending ?? 0,
            approved: json.approved ?? 0,
            paid: json.paid ?? 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch commissions", err);
      }
    };

    fetchCommissions();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-xl font-bold mb-4 text-teal-700">Your Commissions</h2>
      <ul className="space-y-2">
        <li className="flex justify-between text-sm">
          <span>Pending</span>
          <span className="text-yellow-600">${(data?.pending ?? 0).toFixed(2)}</span>
        </li>
        <li className="flex justify-between text-sm">
          <span>Approved</span>
          <span className="text-blue-600">${(data?.approved ?? 0).toFixed(2)}</span>
        </li>
        <li className="flex justify-between text-sm">
          <span>Paid</span>
          <span className="text-green-600">${(data?.paid ?? 0).toFixed(2)}</span>
        </li>
      </ul>
    </div>
  );
}
