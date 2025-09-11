// components/merchant/MerchantsSection.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import MerchantCard, { MerchantItem } from "./MerchantCard";

export default function MerchantsSection() {
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "PENDING" | "REJECTED">("ALL");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/user/merchants", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch merchants");
        const data = await res.json();
        if (!alive) return;
        const order = { ACTIVE: 0, PENDING: 1, REJECTED: 2 } as Record<string, number>;
        const sorted = (data.merchants ?? []).sort(
          (a: MerchantItem, b: MerchantItem) => (order[a.status] ?? 99) - (order[b.status] ?? 99)
        );
        setMerchants(sorted);
      } catch (e) {
        console.error("[MerchantsSection] load error:", e);
        setMerchants([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
    <section className="mt-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Merchants</h2>
          <p className="text-sm text-gray-600">
            Active programs are ready to use. Pending are greyed out until approved.
          </p>
        </div>
      </div>

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

      {loading ? (
        <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-600">
          Loading merchants…
        </div>
      ) : filtered.length === 0 ? (
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
    </section>
  );
}
