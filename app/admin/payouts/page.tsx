// app/admin/payouts/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";
import FloatTrackerCard from "@/components/admin/floatTrackerCard";

export default async function AdminPayoutPage() {
  const payouts = await prisma.payout.findMany({
    where: { status: "Pending" },
    include: {
      user: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const autoToggleState = await prisma.eventLogs.findFirst({
    where: { type: "autoPayoutToggle" },
    orderBy: { createdAt: "desc" },
  });

  const autoPayoutOn = autoToggleState?.message === "true";

  return (
    <div className="p-6">
      <FloatTrackerCard />
      <h1 className="text-2xl font-bold mb-4">Admin: Payout Manager</h1>

      <div className="mb-6 p-4 bg-white rounded-lg shadow w-fit">
        <h2 className="text-lg font-semibold mb-2">Auto Payouts</h2>
        <label className="inline-flex items-center cursor-pointer opacity-60">
          <input
            type="checkbox"
            checked={autoPayoutOn}
            readOnly
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all duration-200" />
          <span className="ml-3 text-sm">
            {autoPayoutOn ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>

      {payouts.length === 0 ? (
        <p>No pending commissions.</p>
      ) : (
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p: {
              id: string;
              amount: number;
              status: string;
              user: { email: string };
            }) => (
              <tr key={p.id}>
                <td className="border px-4 py-2">{p.user.email}</td>
                <td className="border px-4 py-2">${p.amount.toFixed(2)}</td>
                <td className="border px-4 py-2">{p.status}</td>
                <td className="border px-4 py-2">
                  <span className="text-gray-500">Manual only</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
