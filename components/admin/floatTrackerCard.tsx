// components/admin/floatTrackerCard.tsx

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "../../lib/db"; // ✅ fixed path

export default async function FloatTrackerCard() {
  const totalFloat = await prisma.floatLog.aggregate({
    _sum: { amount: true },
  });

  const totalPayouts = await prisma.payout.aggregate({
    _sum: { amount: true },
    where: { status: "Paid" },
  });

  const float = totalFloat._sum.amount || 0;
  const paid = totalPayouts._sum.amount || 0;
  const available = float - paid;

  return (
    <div className="border p-4 rounded bg-white shadow-md mb-6">
      <h2 className="text-lg font-semibold mb-2">💼 Float Tracker</h2>
      <p><strong>Total Float Received:</strong> ${float.toFixed(2)}</p>
      <p><strong>Total Paid Out:</strong> ${paid.toFixed(2)}</p>
      <p>
        <strong>Available Float:</strong>{" "}
        <span className={available > 0 ? "text-green-600" : "text-red-600"}>
          ${available.toFixed(2)}
        </span>
      </p>
    </div>
  );
}
