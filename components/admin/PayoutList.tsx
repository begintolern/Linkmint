// components/admin/PayoutList.tsx
"use client";

import { useEffect, useState } from "react";

type Payout = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    email: string;
  };
};

export default function PayoutList() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayouts() {
      const res = await fetch("/api/admin/payouts");
      const data = await res.json();
      setPayouts(data.payouts);
      setLoading(false);
    }

    fetchPayouts();
  }, []);

  const markAsPaid = async (id: string) => {
    const res = await fetch("/api/admin/payouts", {
      method: "POST",
      body: JSON.stringify({ payoutId: id }),
    });

    if (res.ok) {
      setPayouts((\1: any) =>
        prev.map((\1: any) => (p.id === id ? { ...p, status: "Paid" } : p))
      );
    }
  };

  if (loading) return <p>Loading payouts...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Pending Payouts</h2>
      {payouts.length === 0 && <p>No pending payouts.</p>}
      <ul className="divide-y divide-gray-200">
        {payouts.map((\1: any) => (
          <li key={payout.id} className="py-4 flex justify-between items-center">
            <div>
              <p><strong>Email:</strong> {payout.user.email}</p>
              <p><strong>Amount:</strong> ${payout.amount.toFixed(2)}</p>
              <p><strong>Date:</strong> {new Date(payout.createdAt).toLocaleString()}</p>
            </div>
            {payout.status === "Pending" ? (
              <button
                onClick={() => markAsPaid(payout.id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Mark as Paid
              </button>
            ) : (
              <span className="text-green-600">Paid</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
