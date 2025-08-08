// app/dashboard/ReferralCardWrapper.tsx
"use client";

import { useEffect, useState } from "react";

type BatchUser = { email: string };
type ReferralBatch = {
  id: string;
  startedAt: string | null;
  expiresAt: string | null;
  users: BatchUser[];
};

export default function ReferralCardWrapper() {
  const [batches, setBatches] = useState<ReferralBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // Assumes you have /api/referrals/batch returning an array of groups
        const res = await fetch("/api/referrals/batch", { cache: "no-store" });
        if (!res.ok) {
          const msg = (await res.json())?.error ?? "Failed to load referral batches.";
          throw new Error(msg);
        }
        const data = await res.json();
        // Be tolerant of either {batches:[...]} or [...]
        setBatches(Array.isArray(data) ? data : data.batches ?? []);
      } catch (err: any) {
        setErrorMsg(err?.message ?? "Failed to load referral batches.");
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  const daysLeft = (expiresAt: string | null) => {
    if (!expiresAt) return 0;
    const now = Date.now();
    const end = new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((end - now) / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Referral Progress</h2>

      {loading && <div className="text-sm text-gray-600">Loading…</div>}
      {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

      {!loading && !errorMsg && batches.length === 0 && (
        <div className="rounded border p-4 text-sm text-gray-700 bg-white">
          No referral batches yet. Invite 3 people to form your first batch.
        </div>
      )}

      {batches.map((batch) => {
        const total = batch.users?.length ?? 0;
        const left = daysLeft(batch.expiresAt);
        const active = left > 0 && total >= 3;

        return (
          <div key={batch.id} className="rounded border p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="font-medium">Batch #{batch.id.slice(0, 6)}</div>
              <div className={`text-sm ${active ? "text-green-600" : "text-gray-600"}`}>
                {active ? "Active" : "Not active"}
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-700">
              Referrals: <span className="font-semibold">{total}</span> / 3
            </div>
            <div className="text-sm text-gray-700">
              Days left: <span className="font-semibold">{left}</span>
            </div>

            {batch.users?.length ? (
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                {batch.users.map((u, idx) => (
                  <li key={idx}>{u.email}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
