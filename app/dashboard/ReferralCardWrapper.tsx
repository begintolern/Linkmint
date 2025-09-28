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

type BonusData = {
  ok: boolean;
  user?: { id: string; email: string };
  totals?: { totalReferrals: number; permanentOverrideBps: number };
  milestones?: { at: number; bps: number }[];
  error?: string;
};

export default function ReferralCardWrapper() {
  const [batches, setBatches] = useState<ReferralBatch[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  const [bonus, setBonus] = useState<BonusData | null>(null);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);

  // Load referral batches
  useEffect(() => {
    const fetchBatches = async () => {
      setBatchLoading(true);
      setBatchError(null);
      try {
        const res = await fetch("/api/referrals/batch", { cache: "no-store" });
        if (!res.ok) {
          const msg = (await res.json())?.error ?? "Failed to load referral batches.";
          throw new Error(msg);
        }
        const data = await res.json();
        setBatches(Array.isArray(data) ? data : data.batches ?? []);
      } catch (err: any) {
        setBatchError(err?.message ?? "Failed to load referral batches.");
      } finally {
        setBatchLoading(false);
      }
    };
    fetchBatches();
  }, []);

  // Load permanent bonus / totals
  useEffect(() => {
    const fetchBonus = async () => {
      setBonusLoading(true);
      setBonusError(null);
      try {
        const res = await fetch("/api/user/referral-bonus", { cache: "no-store" });
        const json: BonusData = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        setBonus(json);
      } catch (e: any) {
        setBonusError(e.message || "Failed to load referral bonus.");
      } finally {
        setBonusLoading(false);
      }
    };
    fetchBonus();
  }, []);

  const daysLeft = (expiresAt: string | null) => {
    if (!expiresAt) return 0;
    const now = Date.now();
    const end = new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((end - now) / (1000 * 60 * 60 * 24)));
  };

  // --- Bonus helpers ---
  const totalRefs = bonus?.totals?.totalReferrals ?? 0;
  const permanentBps = bonus?.totals?.permanentOverrideBps ?? 0; // 100 bps = 1%
  const permanentPct = (permanentBps / 100).toFixed(2);
  const milestones = bonus?.milestones ?? [
    { at: 15, bps: 100 },
    { at: 30, bps: 200 },
    { at: 60, bps: 300 },
    { at: 100, bps: 500 },
  ];

  // Next milestone info
  const nextMs = milestones.find((m) => totalRefs < m.at);
  const reachedMs = milestones.filter((m) => totalRefs >= m.at);
  const maxMs = milestones[milestones.length - 1]?.at ?? 100;

  // Progress (0..100)
  const progressDenom = nextMs ? nextMs.at : maxMs;
  const progressNumer = Math.min(totalRefs, progressDenom);
  const progressPct = Math.min(100, Math.round((progressNumer / progressDenom) * 100));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Referral Progress</h2>

      {/* Permanent Bonus Card */}
      <div className="rounded-2xl ring-1 ring-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-emerald-700">
              Permanent Referral Bonus
            </div>
            {bonusLoading ? (
              <div className="text-sm text-emerald-900/80 mt-1">Loading&hellip;</div>
            ) : bonusError ? (
              <div className="text-sm text-red-700">{bonusError}</div>
            ) : (
              <>
                <div className="text-lg font-semibold mt-1">
                  +{permanentPct}%&nbsp;
                  <span className="text-sm font-normal text-emerald-900/70">
                    (from {totalRefs} referrals)
                  </span>
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full rounded bg-emerald-100 overflow-hidden">
                    <div
                      className="h-2 bg-emerald-500"
                      style={{ width: `${progressPct}%` }}
                      aria-label={`Progress ${progressPct}%`}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-emerald-900/70">
                    <span>
                      {nextMs
                        ? `${totalRefs}/${nextMs.at} refs → +${(nextMs.bps / 100).toFixed(2)}%`
                        : `Max milestone reached`}
                    </span>
                    <span>
                      {reachedMs.length
                        ? `Reached: ${reachedMs.map((m) => `+${(m.bps / 100).toFixed(2)}%`).join(", ")}`
                        : "No milestones yet"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <a
            href="/dashboard/referrals"
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-emerald-300 hover:bg-emerald-100"
          >
            Invite Friends
          </a>
        </div>
      </div>

      {/* Batches Section (existing UI) */}
      {batchLoading && <div className="text-sm text-gray-600">Loading…</div>}
      {batchError && <div className="text-sm text-red-600">{batchError}</div>}

      {!batchLoading && !batchError && batches.length === 0 && (
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
