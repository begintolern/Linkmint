'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Payout = {
  id: string;
  amount: number;
  method: string;
  status: string;
  userId: string | null;
  details: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string; // ISO string coming from server
};

export default function Controls({ initialLogs }: { initialLogs: Payout[] }) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const handleRefresh = () => {
    // Revalidate server component and refetch logs
    router.refresh();
  };

  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      // Convert to CSV on the client from the already-rendered data
      const rows = [
        [
          'id',
          'amount',
          'method',
          'status',
          'userId',
          'details',
          'approvedAt',
          'paidAt',
          'createdAt',
        ],
        ...initialLogs.map((r) => [
          r.id,
          r.amount,
          r.method,
          r.status,
          r.userId ?? '',
          (r.details ?? '').replace(/\r?\n/g, ' '),
          r.approvedAt ?? '',
          r.paidAt ?? '',
          r.createdAt,
        ]),
      ];

      const csv = rows
        .map((cols) =>
          cols
            .map((c) => {
              const s = String(c);
              // escape quotes and wrap fields that contain commas/quotes/newlines
              const escaped = s.replace(/"/g, '""');
              return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
            })
            .join(',')
        )
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `payout-logs-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mb-4 flex gap-2">
      <button
        onClick={handleRefresh}
        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
      >
        Refresh
      </button>

      <button
        onClick={handleExportCSV}
        disabled={downloading || initialLogs.length === 0}
        className="px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {downloading ? 'Preparing CSV…' : 'Export CSV'}
      </button>
    </div>
  );
}
