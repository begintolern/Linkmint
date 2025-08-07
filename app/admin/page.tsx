// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminPage() {
  const [autoPayoutsOn, setAutoPayoutsOn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get("/api/admin/auto-payout-status");
        setAutoPayoutsOn(res.data.autoPayoutsOn);
      } catch (error) {
        console.error("Error fetching auto payout status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {loading ? (
        <p>Loading payout status...</p>
      ) : (
        <p>
          Auto Payouts:{" "}
          <span className={autoPayoutsOn ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
            {autoPayoutsOn ? "ON" : "OFF"}
          </span>
        </p>
      )}
    </div>
  );
}
