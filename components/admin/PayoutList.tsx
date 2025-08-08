// components/admin/PayoutList.tsx
"use client";

import { useEffect, useState } from "react";

type Payout = {
  id: string;
  userEmail: string;
  amount: number;
  status: "Pending" | "Approved" | "Paid";
  createdAt: string;
};

export default function PayoutList() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // Expected response shape: { payouts: Payout[] }
        const res = await fetch("/api/admin/payouts", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load payouts (${res.status})`);
        const data = await res.json();
        setPayouts(Array.isArray(data) ? data : data.payouts ?? []);
      } catch (err: any) {
        setErrorMsg(err?.message ?? "Failed to load payouts");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const markAsPaid = async (id: string) => {
    // optimistic update
    setPayouts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Paid" } : p))
    );

    try {
      const res = await fetch(`/api/admin/mark-paid?id=${encodeURIComponent(id)}`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Mark paid failed (${res.status})`);
      }
    } catch (err) {
      // revert optimistic update on failure
      setPayouts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "Approved" } : p))
      );
      setErrorMsg((err as any)?.message ?? "Failed to mark as paid");
    }
  };

  return (
    <div className="rounded border p-4 bg-white">
      <h3 className="font-semibold mb-3">Payouts</h3>

      {loading && <div className="text-sm text-gray-600">Loading…</div>}
      {errorMsg && <div className="text-sm text-red-600 mb-2">{errorMsg}</div>}

      {!loading && payouts.length === 0 && (
        <div className="text-sm text-gray-700">No payouts found.</div>
      )}

      {payouts.length > 0 && (
        <table className="w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th className="py-2">User</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Status</th>
              <th className="py-2">Created</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b last:border-b-0">
                <td className="py-2">{p.userEmail}</td>
                <td className="py-2">${p.amount.toFixed(2)}</td>
                <td className="py-2">{p.status}</td>
                <td className="py-2">
                  {new Date(p.createdAt).toLocaleString()}
                </td>
                <td className="py-2">
                  {p.status !== "Paid" && (
                    <button
                      className="rounded bg-black text-white px-3 py-1 text-xs"
                      onClick={() => markAsPaid(p.id)}
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
