export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Controls from './Controls';

export default function PayoutLogsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Payout Logs</h1>
      <p className="text-sm text-gray-600 mb-4">
        Showing the most recent payout events from production.
      </p>
      <Controls />
    </div>
  );
}
