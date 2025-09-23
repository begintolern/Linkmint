"use client";

import { useEffect, useState } from "react";

type HealthPayload = {
  ok: boolean;
  status: string;
  tookMs: number;
  uptimeSec: number;
  version: string | null;
  env: string | null;
  region: string | null;
  db: { ok: boolean; latencyMs: number | null; error: string | null };
  runtime?: { node: string; rssMB: number | null; heapMB: number | null };
  now: string;
};

export default function AdminHealthStatusCard() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health?full=1", { cache: "no-store" });
      const json = (await res.json()) as HealthPayload;
      setData(json);
    } catch (err) {
      console.error("Admin health fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading system health…</p>;
  if (!data) return <p className="text-sm text-red-600">Failed to load system health.</p>;

  const pillCls =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const ok = data.ok;

  return (
    <div className="rounded-lg border p-4 bg-white shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold">System Health (Admin)</h3>
        <span className={`${pillCls} ${ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {ok ? "Healthy" : "Degraded"}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Info label="Env" value={data.env ?? "—"} />
        <Info label="Region" value={data.region ?? "—"} />
        <Info label="Version" value={data.version ?? "—"} mono truncate />
        <Info label="Now" value={new Date(data.now).toLocaleString()} />

        <Info label="API latency" value={`${data.tookMs} ms`} />
        <Info label="DB ok" value={String(data.db.ok)} />
        <Info label="DB latency" value={`${data.db.latencyMs ?? "—"} ms`} />
        <Info label="DB error" value={data.db.error ?? "—"} />

        <Info label="Uptime" value={`${Math.floor(data.uptimeSec / 60)} min`} />
        <Info label="Node.js" value={data.runtime?.node ?? "—"} />
        <Info label="RSS" value={data.runtime?.rssMB != null ? `${data.runtime!.rssMB} MB` : "—"} />
        <Info label="Heap" value={data.runtime?.heapMB != null ? `${data.runtime!.heapMB} MB` : "—"} />
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span
        className={[
          "text-gray-900",
          mono ? "font-mono" : "",
          truncate ? "truncate max-w-[220px]" : "",
        ].join(" ")}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
