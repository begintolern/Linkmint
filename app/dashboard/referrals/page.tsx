// app/dashboard/referrals/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ReferralRow = {
  id: string;
  email?: string | null;
  name?: string | null;
  joinedAt?: string | null;     // ISO date
  status?: string | null;       // INVITED | JOINED | EARNING
  earningsCents?: number | null;
};

type ApiResponse =
  | { ok: true; referrals: ReferralRow[]; inviteUrl?: string }
  | { ok: false; error?: string };

export default function ReferralsPage() {
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [invite, setInvite] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        // Try canonical endpoint; fall back to /api/referrals if needed
        let res = await fetch("/api/referrals/list", { cache: "no-store" });
        if (!res.ok) res = await fetch("/api/referrals", { cache: "no-store" });
        const json: ApiResponse = await res.json();
        if (!("ok" in json) || !json.ok) throw new Error((json as any)?.error || "Failed to load referrals.");
        setRows(json.referrals ?? []);
        setInvite(json.inviteUrl || "");
      } catch (e: any) {
        setErr(e?.message || "Failed to load referrals.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const earnings =
      rows.reduce((a, r) => a + (typeof r.earningsCents === "number" ? r.earningsCents : 0), 0) / 100;
    const invited = rows.length;
    const joined = rows.filter((r) => (r.status || "").toUpperCase() !== "INVITED").length;
    const earning = rows.filter((r) => (r.status || "").toUpperCase() === "EARNING").length;
    return { earnings, invited, joined, earning };
  }, [rows]);

  return (
    <main className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Referrals</h1>
          <p className="text-sm text-gray-600">Invite friends — earn a 5% bonus on their approved commissions.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <StatBadge label="Invited" value={totals.invited} />
          <StatBadge label="Joined" value={totals.joined} />
          <StatBadge label="Earning" value={totals.earning} />
          <MoneyBadge label="Your bonus" value={totals.earnings} />
        </div>
      </header>

      {/* Mobile stats */}
      <div className="sm:hidden grid grid-cols-2 gap-2">
        <StatBadge block label="Invited" value={totals.invited} />
        <StatBadge block label="Joined" value={totals.joined} />
        <StatBadge block label="Earning" value={totals.earning} />
        <MoneyBadge block label="Your bonus" value={totals.earnings} />
      </div>

      {/* Invite link card */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5 space-y-3">
        <h2 className="text-sm sm:text-base font-medium">Invite link</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            readOnly
            value={invite || "Generating invite link…"}
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => invite && navigator.clipboard.writeText(invite)}
              disabled={!invite}
            >
              Copy
            </button>
            <a
              className="rounded-lg bg-teal-600 text-white px-3 py-2 text-sm hover:bg-teal-700 text-center"
              href={invite || "#"}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!invite}
              onClick={(e) => { if (!invite) e.preventDefault(); }}
            >
              Open
            </a>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Share this link with friends. When they earn, you get a <strong>5% bonus</strong> on approved commissions.
        </p>
      </section>

      {/* Table */}
      <section className="rounded-xl border bg-white">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <h2 className="text-sm sm:text-base font-medium">Your referrals</h2>
          <span className="hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs text-gray-700">
            Bonus so far: ${totals.earnings.toFixed(2)}
          </span>
        </div>

        {err && (
          <div className="mx-3 sm:mx-4 mb-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 p-2 text-xs">
            {err} — showing empty results.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left z-10">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Status</th>
                <th className="p-3 hidden sm:table-cell">Joined</th>
                <th className="p-3">Your bonus</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-6 text-gray-500" colSpan={4}>Loading…</td></tr>
              ) : rows.length ? (
                rows.map((r) => {
                  const joined =
                    r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : "—";
                  const label = r.name || r.email || "Unknown";
                  const status = (r.status || "INVITED").toUpperCase();
                  const bonus = (r.earningsCents ?? 0) / 100;

                  return (
                    <tr key={r.id} className="border-t align-middle">
                      <td className="p-3">
                        <div className="font-medium">{label}</div>
                        {/* Mobile-only extra */}
                        <div className="sm:hidden text-xs text-gray-500 mt-0.5">
                          Joined: {joined}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">
                          {status}
                        </span>
                      </td>
                      <td className="p-3 hidden sm:table-cell">{joined}</td>
                      <td className="p-3 font-medium">${bonus.toFixed(bonus % 1 === 0 ? 0 : 2)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td className="p-6 text-gray-500" colSpan={4}>No referrals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatBadge({ label, value, block = false }: { label: string; value: number; block?: boolean }) {
  return (
    <span className={`inline-flex ${block ? "w-full justify-between" : "items-center"} rounded-xl border px-3 py-1.5 text-xs sm:text-sm bg-white`}>
      <span className="font-medium">{label}</span>
      <span className="ml-2 tabular-nums">{value}</span>
    </span>
  );
}

function MoneyBadge({ label, value, block = false }: { label: string; value: number; block?: boolean }) {
  return (
    <span className={`inline-flex ${block ? "w-full justify-between" : "items-center"} rounded-xl border px-3 py-1.5 text-xs sm:text-sm bg-white`}>
      <span className="font-medium">{label}</span>
      <span className="ml-2 tabular-nums">${value.toFixed(2)}</span>
    </span>
  );
}
