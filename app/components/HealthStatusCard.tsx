// app/components/HealthStatusCard.tsx
"use client";

import { useEffect, useState } from "react";

type Health = {
  ok?: boolean;
  success?: boolean;
  rssMB?: number | null;
  heapMB?: number | null;
};

export default function HealthStatusCard() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const json: any = (res.ok && (await res.json().catch(() => ({})))) || {};

        const ok =
          (typeof json.ok === "boolean" && json.ok) ||
          (typeof json.success === "boolean" && json.success) ||
          false;

        // Safely extract from multiple shapes:
        // { heapMB, rssMB } or { memory: { heapMB, rssMB } } or { runtime: { heapMB, rssMB } }
        const heapMB =
          (typeof json.heapMB === "number" && json.heapMB) ??
          (typeof json.memory?.heapMB === "number" && json.memory.heapMB) ??
          (typeof json.runtime?.heapMB === "number" && json.runtime.heapMB) ??
          null;

        const rssMB =
          (typeof json.rssMB === "number" && json.rssMB) ??
          (typeof json.memory?.rssMB === "number" && json.memory.rssMB) ??
          (typeof json.runtime?.rssMB === "number" && json.runtime.rssMB) ??
          null;

        if (mounted) setData({ ok, heapMB, rssMB });
      } catch {
        if (mounted) setData({ ok: false, heapMB: null, rssMB: null });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const ok = data?.ok ?? false;

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">System Health</h3>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ${
            ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: ok ? "#16a34a" : "#dc2626" }} />
          {ok ? "OK" : "Degraded"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Stat label="RSS (MB)" value={fmtNum(data?.rssMB)} loading={loading} />
        <Stat label="Heap (MB)" value={fmtNum(data?.heapMB)} loading={loading} />
      </div>
    </div>
  );
}

function Stat({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-0.5 font-medium">{loading ? "…" : value}</div>
    </div>
  );
}

function fmtNum(n: number | null | undefined) {
  return typeof n === "number" && Number.isFinite(n) ? String(n) : "—";
}
