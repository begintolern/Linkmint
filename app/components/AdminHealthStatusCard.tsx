// app/components/AdminHealthStatusCard.tsx
"use client";

import { useEffect, useState } from "react";

type Health = {
  ok?: boolean;
  success?: boolean;
  rssMB?: number | null;
  heapMB?: number | null;
  uptimeSec?: number | null;
  node?: string | null;
  notes?: string | null;
};

export default function AdminHealthStatusCard() {
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Prefer ops endpoint; fallback to generic health
        const tryUrls = ["/api/ops/health-check", "/api/health"];
        let json: any | null = null;

        for (const url of tryUrls) {
          try {
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) {
              json = await res.json().catch(() => ({}));
              break;
            }
          } catch {
            // ignore and try next
          }
        }

        if (!json || typeof json !== "object") {
          throw new Error("health payload missing");
        }

        const okFlag =
          (typeof json.ok === "boolean" && json.ok) ||
          (typeof json.success === "boolean" && json.success) ||
          false;

        const rssMB =
          typeof json.rssMB === "number"
            ? json.rssMB
            : typeof json.memory?.rssMB === "number"
              ? json.memory.rssMB
              : null;

        const heapMB =
          typeof json.heapMB === "number"
            ? json.heapMB
            : typeof json.memory?.heapMB === "number"
              ? json.memory.heapMB
              : null;

        const uptimeSec =
          typeof json.uptimeSec === "number"
            ? json.uptimeSec
            : typeof json.uptime === "number"
              ? json.uptime
              : null;

        const node =
          typeof json.node === "string"
            ? json.node
            : typeof json.runtime?.node === "string"
              ? json.runtime.node
              : null;

        const notes =
          typeof json.notes === "string"
            ? json.notes
            : typeof json.message === "string"
              ? json.message
              : null;

        const cleaned: Health = { ok: okFlag, success: undefined, rssMB, heapMB, uptimeSec, node, notes };

        if (mounted) setData(cleaned);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "health fetch failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const ok = data?.ok ?? data?.success ?? false;

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">System Health (Admin)</h3>
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
        <Stat label="Uptime (s)" value={fmtNum(data?.uptimeSec)} loading={loading} />
        <Stat label="Node" value={data?.node ?? "—"} loading={loading} />
      </div>

      {(error || data?.notes) && (
        <div className="mt-3 text-xs text-gray-600">
          {error ? `Note: ${error}` : data?.notes}
        </div>
      )}
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
