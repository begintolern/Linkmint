// components/admin/AutoPayoutStatusCard.tsx
"use client";

import { useEffect, useState } from "react";

export default function AutoPayoutStatusCard() {
  const [status, setStatus] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/get-auto-payout-setting")
      .then((\1: any) => res.json())
      .then((\1: any) => {
        setStatus(data.value);
      })
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 border rounded bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">Auto Payout Setting</h2>
      {loading ? (
        <p>Loading...</p>
      ) : status !== null ? (
        <p>
          Current status:{" "}
          <span className={`font-bold ${status ? "text-green-600" : "text-red-600"}`}>
            {status ? "Enabled" : "Disabled"}
          </span>
        </p>
      ) : (
        <p className="text-red-500">Failed to load setting.</p>
      )}
    </div>
  );
}
