// app/admin/payout-logs/page.tsx
import { prisma } from '@/lib/db';
import Controls from './Controls';

// Server component: fetch once for initial render
export default async function PayoutLogsPage() {
  const logs = await prisma.payout.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Payout Logs</h1>
      <p className="text-sm text-gray-600 mb-4">
        Showing the most recent payout events from production.
      </p>

      <Controls initialLogs={logs as any} />
    </div>
  );
}
