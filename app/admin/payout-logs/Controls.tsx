'use client';

import * as React from 'react';

type Log = {
  id: string;
  amount: number;
  method: string;
  status: string;
  userId: string | null;
  details: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

export default function Controls({ initialLogs }: { initialLogs: Log[] }) {
  const [logs, setLogs] = React.useState<Log[]>(initialLogs);
  const [loading, setLoading] = React.useState(false);

  async function refresh() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/payout-logs-ui', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to refresh');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
      alert('Refresh failed. See console for details.');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const headers = [
      'id',
      'amount',
      'method',
      'status',
      'userId',
      'details',
      'approvedAt',
      'paidAt',
      'createdAt',
    ];

    const rows = logs.map((l) => [
      l.id,
      l.amount,
      l.method,
      l.status,
      l.userId ?? '',
      l.details?.replaceAll('"', '""') ?? '',
      l.approvedAt ?? '',
      l.paidAt ?? '',
      l.createdAt,
    ]);

    const csv =
      headers.join(',') +
      '\n' +
      rows.map((r) => r.map((cell) => `"${String(cell)}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-logs-${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm disabled:opacity-60"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        <button
          onClick={exportCsv}
          className="px-3 py-1.5 rounded-md border text-sm"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Amount</th>
              <th className="px-3 py-2 text-left">Method</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Approved</th>
              <th className="px-3 py-2 text-left">Paid</th>
              <th className="px-3 py-2 text-left">Details</th>
              <th className="px-3 py-2 text-left">ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="px-3 py-2">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">${l.amount.toFixed(2)}</td>
                <td className="px-3 py-2">{l.method}</td>
                <td className="px-3 py-2">{l.status}</td>
                <td className="px-3 py-2">{l.userId ?? '—'}</td>
                <td className="px-3 py-2">{l.approvedAt ? new Date(l.approvedAt).toLocaleString() : '—'}</td>
                <td className="px-3 py-2">{l.paidAt ? new Date(l.paidAt).toLocaleString() : '—'}</td>
                <td className="px-3 py-2">{l.details ?? '—'}</td>
                <td className="px-3 py-2">{l.id}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={9}>
                  No logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
