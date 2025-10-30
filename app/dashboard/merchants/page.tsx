'use client';

import { useEffect, useMemo, useState } from 'react';

type Viewer = {
  id: string | null;
  email: string | null;
  role: 'admin' | 'user';
  region: string | null;
};

type MerchantRule = {
  id: string;
  merchantName: string | null;
  network: string | null;
  domainPattern: string | null;
  cookieWindowDays: number | null;
  payoutDelayDays: number | null;
  commissionType: string | null;
  commissionRate: string | null;
  notes: string | null;
  market: string | null; // "PH" | "US" | etc.
  createdAt: string;
  updatedAt: string;
};

type ListResp = {
  ok: boolean;
  page: number;
  limit: number;
  total: number;
  canViewAll: boolean;
  items: MerchantRule[];
};

export default function MerchantsPage() {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [items, setItems] = useState<MerchantRule[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin-only toggle: Show all regions
  const [showAllRegions, setShowAllRegions] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('merchantsShowAll');
    return saved === '1';
  });

  const isAdmin = viewer?.role === 'admin';

  useEffect(() => {
    // Load viewer to know if we should show the admin-only toggle
    (async () => {
      try {
        const res = await fetch('/api/viewer', { cache: 'no-store' });
        const data = await res.json();
        setViewer(data.viewer ?? null);
      } catch {
        setViewer(null);
      }
    })();
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (q.trim()) params.set('q', q.trim());
    // Only send all=1 if the admin toggled it on
    if (isAdmin && showAllRegions) params.set('all', '1');
    return params.toString();
  }, [page, limit, q, isAdmin, showAllRegions]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/merchant-rules/list?${queryString}`, {
        cache: 'no-store',
      });
      const data: ListResp = await res.json();
      if (data.ok) {
        setItems(data.items || []);
        setTotal(data.total || 0);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  function onToggleAllRegions(next: boolean) {
    setShowAllRegions(next);
    try {
      localStorage.setItem('merchantsShowAll', next ? '1' : '0');
    } catch {}
    setPage(1);
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function handleDelete(id: string) {
    if (!isAdmin) return;
    const yes = confirm('Delete this merchant rule? This cannot be undone.');
    if (!yes) return;
    try {
      const res = await fetch(`/api/merchant-rules/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data?.ok) {
        // refresh list
        load();
      } else {
        alert(data?.error || 'Delete failed');
      }
    } catch (err) {
      alert('Delete failed');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Merchants</h1>

        {/* Admin-only: Show All Regions toggle */}
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAllRegions}
              onChange={(e) => onToggleAllRegions(e.target.checked)}
            />
            Show all regions (admin)
          </label>
        )}
      </div>

      <form onSubmit={onSearchSubmit} className="flex items-center gap-3">
        <input
          className="border rounded px-3 py-2 w-full max-w-md"
          placeholder="Search by name or domain…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      <div className="text-sm text-gray-600">
        {loading
          ? 'Loading…'
          : `Showing ${items.length} of ${total}${isAdmin && showAllRegions ? ' (all regions)' : ''}`}
      </div>

      <div className="grid gap-3">
        {items.map((m) => (
          <div
            key={m.id}
            className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">
                {m.merchantName || '(no name)'}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {m.network || '—'} • {m.domainPattern || '—'} • market:{' '}
                {m.market || '—'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {m.commissionType || '—'} {m.commissionRate || ''}
                {' • '}
                cookie {m.cookieWindowDays ?? '—'}d • payout{' '}
                {m.payoutDelayDays ?? '—'}d
              </div>
            </div>

            {/* Admin-only actions */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(m.id)}
                  className="px-3 py-1.5 rounded bg-red-600 text-white text-sm"
                  title="Delete merchant rule"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {!loading && items.length === 0 && (
          <div className="text-gray-600">No merchants found.</div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <button
          className="px-3 py-2 rounded border disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Prev
        </button>
        <div className="text-sm">
          Page {page} / {totalPages}
        </div>
        <button
          className="px-3 py-2 rounded border disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}
