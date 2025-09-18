// app/dashboard/merchants/page.tsx
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import Link from 'next/link';
import { MerchantHover } from '@/app/components/MerchantHover';

type Merchant = {
  id: string;
  active: boolean;
  merchantName: string;
  network: string | null;
  domainPattern: string | null;
  paramKey?: string | null;
  paramValue?: string | null;
  linkTemplate?: string | null;
  allowedSources?: unknown | null;
  disallowed?: unknown | null;
  cookieWindowDays?: number | null;
  payoutDelayDays?: number | null;
  commissionType: string;
  commissionRate: number | null;
  calc?: string | null;
  rate?: number | null;
  notes?: string | null;
  importMethod: string;
  apiBaseUrl?: string | null;
  apiAuthType?: string | null;
  apiKeyRef?: string | null;
  lastImportedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  status: string;
  allowedRegions: string[];
  inactiveReason?: string | null;
};

async function getMerchants(): Promise<Merchant[]> {
  const primary = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/merchant-rules/list`
    : `/api/merchant-rules/list`;

  const res = await fetch(primary, { cache: 'no-store' });
  const json = await res.json();
  if (!json?.ok) throw new Error('Failed to load merchants');
  return json.merchants as Merchant[];
}

function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'warn' | 'danger';
}) {
  const tones: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warn: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export default async function MerchantsPage() {
  const merchants = await getMerchants();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Merchants</h1>
          <div className="text-sm text-gray-500">{merchants.length} total</div>
        </div>
        <Link
          href="/dashboard/merchants/new"
          className="rounded-md border px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
        >
          + New Merchant
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <th className="px-4 py-3">Merchant</th>
              <th className="px-4 py-3">Network</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Cookie</th>
              <th className="px-4 py-3">Payout Delay</th>
              <th className="px-4 py-3">Regions</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">More</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {merchants.map((m) => (
              <tr key={m.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{m.merchantName}</span>
                    <div className="mt-1 space-x-2">
                      <Badge tone={m.active ? 'success' : 'danger'}>
                        {m.active ? 'Active' : 'Inactive'}
                      </Badge>
                      {m.status && (
                        <Badge
                          tone={m.status === 'PENDING' ? 'warn' : 'default'}
                        >
                          {m.status}
                        </Badge>
                      )}
                      {m.importMethod && <Badge>{m.importMethod}</Badge>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{m.network ?? '—'}</td>
                <td className="px-4 py-3">{m.domainPattern ?? '—'}</td>
                <td className="px-4 py-3">
                  {m.inactiveReason ? (
                    <Badge tone="danger">Blocked</Badge>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  {m.commissionType || '—'}
                  {typeof m.commissionRate === 'number' ? (
                    <span className="ml-1 text-gray-600">
                      {m.commissionType?.toUpperCase() === 'PERCENT'
                        ? `${m.commissionRate}%`
                        : m.commissionRate}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {m.cookieWindowDays ?? '—'}
                  {m.cookieWindowDays ? ' days' : ''}
                </td>
                <td className="px-4 py-3">
                  {m.payoutDelayDays ?? '—'}
                  {m.payoutDelayDays ? ' days' : ''}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {m.allowedRegions?.length ? (
                      m.allowedRegions.map((r) => <Badge key={r}>{r}</Badge>)
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-xs truncate text-gray-700">
                    {m.notes ?? '—'}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <MerchantHover merchant={m} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
