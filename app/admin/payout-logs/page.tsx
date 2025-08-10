// app/admin/payout-logs/page.tsx
import Controls from './Controls';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic'; // optional, if you want fresh data on refresh

export default async function PayoutLogsPage() {
  await requireAdmin();

  const logs = await prisma.payout.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200, // tweak as you like
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      userId: true,
      details: true,
      approvedAt: true,
      paidAt: true,
      createdAt: true,
    },
  });

  // The rest of your existing table stays the same. Just mount the controls.
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Payout Logs</h1>
      <p className="text-sm text-gray-600 mb-4">
        Showing the most recent payout events from production.
      </p>

      <Controls initialLogs={logs as any} />

      {/* your existing table markup below */}
      {/* ... */}
    </div>
  );
}
