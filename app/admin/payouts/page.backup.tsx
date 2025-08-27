'use client';

import React from 'react';

type PayoutRow = {
  id: string;
  createdAt: string;
  provider: 'PAYPAL' | 'PAYONEER' | string;
  statusEnum: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  netCents?: number;
  feeCents?: number;
  amount?: number;
  email?: string | null;
  name?: string | null;
};

function centsToUsd(c?: number) {
  if (typeof c !== 'number') return '-';
  return `$${(c / 100).toFixed(2)}`;
}

export default function AdminPayoutsPage() {
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<PayoutRow[]>([]);
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'ALL' | 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED'>('ALL');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (email.trim()) qs.set('email', email.trim());
      if (status !== 'ALL') qs.set('status', status);

      const res = await fetch(`/api/admin/payouts/list?${qs.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load');
      setRows(Array.isArray(json.rows) ? json.rows : []);
    } catch (e) {
      console.error(e);
      alert('Failed to load payouts.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [email, status]);

  React.useEffect(() => {
    load();
  }, []); // initial

  const totalNet = rows.reduce((sum, r) => sum + (r.netCents ?? 0), 0);

  async function approve(logId: string) {
    try {
      const res = await fetch('/api/admin/payouts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, dryRun: true }) // dry-run approve
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Approve failed');
      alert('Approved (dry‑run). Now mark paid to finalize.');
      await load();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Approve failed');
    }
  }

  async function markPaid(payoutId: string) {
    try {
      const res = await fetch('/api/admin/payouts/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          externalPayoutId: `ADMIN-MANUAL-${Date.now()}`
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Mark paid failed');
      alert('Marked as PAID.');
      await load();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Mark paid failed');
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin · Payouts</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="border rounded px-3 py-2 w-64"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
        </select>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh / Apply Filter'}
        </button>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Created</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Provider</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Net</th>
              <th className="text-left px-3 py-2">Fee</th>
              <th className="text-left px-3 py-2">ID</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-gray-500">
                  No payouts match your filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.email ?? '—'}</td>
                  <td className="px-3 py-2">{r.name ?? '—'}</td>
                  <td className="px-3 py-2">{r.provider}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        {
                          PENDING: 'text-amber-700',
                          PROCESSING: 'text-blue-700',
                          PAID: 'text-green-700',
                          FAILED: 'text-red-700',
                        }[r.statusEnum]
                      }
                    >
                      {r.statusEnum}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {typeof r.netCents === 'number'
                      ? centsToUsd(r.netCents)
                      : r.amount != null
                      ? `$${r.amount.toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2">{centsToUsd(r.feeCents)}</td>
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {(r.statusEnum === 'PENDING' || r.statusEnum === 'PROCESSING') && (
                        <>
                          <button
                            className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200"
                            onClick={() => approve(r.id)}
                            title="Approve (dry‑run)"
                          >
                            Approve
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-green-100 hover:bg-green-200"
                            onClick={() => markPaid(r.id)}
                            title="Mark Paid"
                          >
                            Mark Paid
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600">
        In view total (net): <strong>{centsToUsd(totalNet)}</strong>
      </div>
    </div>
  );
}
