"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Payout = {
  id: string;
  createdAt: string;
  statusEnum: string;
  provider: "PAYPAL" | "PAYONEER";
  netCents: number;
  amount: number | null;
  receiverEmail: string | null;
};

export default function PayoutMiniCard() {
  const [last, setLast] = useState<Payout | null>(null);
  const [method, setMethod] = useState<string>("—");

  useEffect(() => {
    (async () => {
      try {
        // Default payout method
        const acctRes = await fetch("/api/payout-account", { cache: "no-store" });
        const acctJson = await acctRes.json();
        const acct = acctJson.account ?? acctJson.data ?? null;
        if (acct?.provider && (acct?.externalId || acct?.email)) {
          const dest = acct.externalId ?? acct.email;
          setMethod(`${acct.provider} • ${dest}`);
        }

        // Last payout request
        const res = await fetch("/api/payouts/list", { cache: "no-store" });
        const json = await res.json();
        const first: Payout | undefined = json?.payouts?.[0];
        setLast(first ?? null);
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payouts</h3>
        <Link href="/payouts" className="text-sm underline">View all</Link>
      </div>

      <div className="mt-3 text-sm">
        <div className="text-gray-600">Default method</div>
        <div className="font-medium truncate">{method}</div>
      </div>

      <div className="mt-3 text-sm">
        <div className="text-gray-600">Last request</div>
        {last ? (
          <div className="font-medium">
            {last.provider} • ${(last.netCents / 100).toFixed(2)} • {last.statusEnum}
            <div className="text-xs text-gray-500">
              {new Date(last.createdAt).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No payouts yet</div>
        )}
      </div>
    </div>
  );
}
