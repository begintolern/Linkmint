'use client';

import { useEffect, useState } from 'react';

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

export default function Controls() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/payout-logs-ui', { cache: 'no-store' });
    const data = await res.json();
    setLogs(data.logs ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function downloadCSV() {
    const rows = [
      ['createdAt','amount','method','status','userId','approvedAt','paidAt','details','id'],
      ...logs.map(l => [
        l.createdAt, l.amount, l.method, l.status, l.userId ?? '',
        l.approvedAt ?? '', l.paidAt ?? '', l.details ?? '', l.id
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `payout-logs-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button onClick={load} disabled={loading} className="px-3 py-1 rounded bg-gray-900 text-white">
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        <button onClick={downloadCSV} className="px-3 py-1 rounded border">Export CSV</button>
      </div>
      {/* ...table markup as you already have... */}
    </div>
  );
}
