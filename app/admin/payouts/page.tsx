'use client';

import { useEffect, useState } from 'react';

type Payout = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    email: string;
  };
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const response = await fetch('/api/admin/payouts');
        const data = await response.json();
        setPayouts(data.payouts || []);
      } catch (error) {
        console.error('Error fetching payouts:', error);
      }
    };

    fetchPayouts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Payouts</h1>
      <table className="table-auto w-full border-collapse border border-gray-200">
        <thead>
          <tr>
            <th className="border px-4 py-2">User Email</th>
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Created At</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p: any) => (
            <tr key={p.id}>
              <td className="border px-4 py-2">{p.user.email}</td>
              <td className="border px-4 py-2">${p.amount.toFixed(2)}</td>
              <td className="border px-4 py-2">{p.status}</td>
              <td className="border px-4 py-2">
                {new Date(p.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
