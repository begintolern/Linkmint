"use client";

import { useEffect, useState } from "react";

type Group = {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "UNKNOWN";
  startedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  members: string[]; // emails
};

type ApiResp = {
  success: boolean;
  ungroupedInvitees: number;
  groups: Group[];
  badge: string | null;
  referralCode: string | null;
  debug?: {
    inviterId: string | null;
    inviterEmail: string | null;
    batchCountAfter: number | null;
    trustScoreAfter: number | null;
    trustSyncUpdated: boolean | null;
  };
  error?: string;
};

export default function ReferralsTab() {
  const [data, setData] = useState<ApiResp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const r = await fetch("/api/referrals", { cache: "no-store" });
      const j: ApiResp = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || `HTTP ${r.status}`);
      setData(j);
    } catch (e: any) {
      setErr(e.message || "Failed to load referrals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const referralLink =
    typeof window !== "undefined" && data?.referralCode
      ? `${window.location.origin}/signup?ref=${data.referralCode}`
      : null;

  return (
    <div className="rounded-2xl ring-1 ring-zinc-200 p-5 bg-white/70 dark:bg-zinc-900/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Referrals</div>
          <h3 className="text-lg font-semibold">Invite friends & track progress</h3>
          {!!data?.badge && (
            <div className="mt-1 text-xs inline-flex items-center gap-2 rounded-md px-2 py-1 ring-1 ring-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/60">
              Referral Badge: <strong>{data.badge}</strong>
            </div>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-zinc-300 dark:ring-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err && (
        <div className="mt-3 rounded-lg bg-red-50 text-red-800 ring-1 ring-red-200 p-2 text-sm">
          {err}
        </div>
      )}

      {/* Share link */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="text-sm text-zinc-600">Your referral link:</div>
        <code className="rounded-lg bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
          {referralLink ?? "—"}
        </code>
        {referralLink && (
          <button
            onClick={() => navigator.clipboard.writeText(referralLink)}
            className="text-xs rounded-md px-2 py-1 ring-1 ring-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Copy
          </button>
        )}
        <div className="ml-auto text-sm">
          Ungrouped invitees:{" "}
          <span className="font-semibold">{data?.ungroupedInvitees ?? 0}</span>
        </div>
      </div>

      {/* Groups (batches of 3) */}
      <div className="mt-6">
        <div className="text-sm font-medium mb-2">Referral Batches</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left">
                <th className="px-3 py-2">Batch ID</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2">Days Left</th>
                <th className="px-3 py-2">Members (emails)</th>
              </tr>
            </thead>
            <tbody>
              {!data || data.groups.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={6}>
                    No referral batches yet. Invite three friends to complete a batch.
                  </td>
                </tr>
              ) : (
                data.groups.map((g) => (
                  <tr key={g.id} className="border-top border-zinc-200">
                    <td className="px-3 py-2 text-xs max-w-[32ch] truncate" title={g.id}>
                      {g.id}
                    </td>
                    <td className="px-3 py-2">
                      <StatusChip status={g.status} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {g.startedAt ? new Date(g.startedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {g.expiresAt ? new Date(g.expiresAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2">{g.daysRemaining ?? "—"}</td>
                    <td className="px-3 py-2">
                      {g.members.length === 0 ? (
                        <span className="text-zinc-500">—</span>
                      ) : (
                        <ul className="list-disc list-inside">
                          {g.members.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional debug surface */}
      {data?.debug && (
        <details className="mt-6 rounded-lg bg-zinc-50 p-3 text-xs ring-1 ring-zinc-200 dark:bg-zinc-900/50 dark:ring-zinc-700">
          <summary className="cursor-pointer">Debug</summary>
          <pre className="mt-2 whitespace-pre-wrap">
{JSON.stringify(data.debug, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: Group["status"] }) {
  const s = status.toLowerCase();
  let cls =
    "bg-zinc-100 text-zinc-800 ring-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-100 dark:ring-zinc-700";
  if (s === "active")
    cls =
      "bg-green-50 text-green-800 ring-green-200 dark:bg-green-950/30 dark:text-green-200 dark:ring-green-900/60";
  if (s === "expired")
    cls =
      "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/60";
  return <span className={`rounded-md px-2 py-0.5 text-xs ring-1 ${cls}`}>{status}</span>;
}
