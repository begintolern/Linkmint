// components/admin/AutoPayoutStatusCard.tsx
"use client";

import { useEffect, useState } from "react";

export default function AutoPayoutStatusCard() {
  const [status, setStatus] = useState<"on" | "off" | "unknown">("unknown");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/get-auto-payout-setting", {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch setting (${res.status})`);
        }
        const data = await res.json();
        // Expecting { value: "on" | "off" }
        setStatus((data?.value === "on" || data?.value === "off") ? data.value : "unknown");
      } catch (err: any) {
        setErrorMsg(err?.message ?? "Failed to load setting");
        setStatus("unknown");
      }
    };
    load();
  }, []);

  return (
    <div className="rounded border p-4 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Auto Payout Engine</h3>
        <span
          className={`text-sm ${
            status === "on"
              ? "text-green-600"
              : status === "off"
              ? "text-gray-600"
              : "text-yellow-600"
          }`}
        >
          {status === "on" ? "ON" : status === "off" ? "OFF" : "UNKNOWN"}
        </span>
      </div>
      {errorMsg && <div className="mt-2 text-sm text-red-600">{errorMsg}</div>}
      <p className="mt-2 text-sm text-gray-700">
        This shows whether automatic payouts are currently enabled in admin.
      </p>
    </div>
  );
}
