// app/dashboard/merchants/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import MerchantCard, { MerchantItem } from "@/components/merchant/MerchantCard";

async function fetchMerchants(): Promise<MerchantItem[]> {
  const res = await fetch("/api/user/merchants", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.merchants ?? [];
}

export default async function UserMerchantsPage() {
  const merchants = await fetchMerchants();

  // Pre-sort on server (Active → Pending → Rejected)
  const order = { ACTIVE: 0, PENDING: 1, REJECTED: 2 } as Record<string, number>;
  const sorted = [...merchants].sort(
    (a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99)
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Merchants</h1>
        <p className="text-sm text-gray-600">
          Browse available programs. <span className="font-medium">Active</span> are ready to use.
          <span className="mx-1">Pending</span> appear greyed out until approval.
        </p>
      </div>

      {/* Client-side search/filter (islands) */}
      <MerchantsClient merchants={sorted} />
    </div>
  );
}

// --- Client component for search & filter ---
"use client";
import { useMemo, useState } from "react";

function MerchantsClient({ merchants }: { merchants: MerchantItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "PENDING" | "REJECTED">("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return merchants.filter((m) => {
      const statusOk = status === "ALL" ? true : m.status === status;
      const text = `${m.name ?? ""} ${m.domain ?? ""} ${m.network ?? ""}`.toLowerCase();
      const qOk = q ? text.includes(q) : true;
      return statusOk && qOk;
    });
  }, [query, merchants, status]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring"
            placeholder="Search by name, domain, or network…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="md:w-56">
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-600">
          No merchants match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((m) => (
            <MerchantCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </>
  );
}
