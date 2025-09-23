"use client";

import { useEffect, useState } from "react";

type HealthPayload = {
  ok: boolean;
  status: string;
  tookMs: number;
  uptimeSec: number;
  version: string | null;
  env: string | null;
  db: { ok: boolean; latencyMs: number | null; error: string | null };
  runtime: { node: string; rssMB: number | null; heapMB: number | null };
};

export default function HealthStatusCard() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/health");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Health fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();

    // Auto refresh every 30s
    const id = setInterval(fetchHealth, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading health…</p>;
  if (!data) return <p className="text-sm text-red-600">Failed to load health.</p>;

  return (
    <div className="rounded-lg border p-4 bg-white shadow-sm">
      <h3 className="text-base font-medium mb-2">System Health</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Status:</div>
        <div className={data.ok ? "text-green-600" : "text-red-600"}>
          {data.ok ? "Healthy" : "Error"}
        </div>

        <div>DB latency:</div>
        <div>{data.db.latencyMs} ms</div>

        <div>Uptime:</div>
        <div>{Math.floor(data.uptimeSec / 60)} min</div>

        <div>Memory:</div>
        <div>{data.runtime.heapMB} MB</div>

        <div>Node.js:</div>
        <div>{data.runtime.node}</div>

        <div>Version:</div>
        <div className="truncate">{data.version ?? "—"}</div>
      </div>
    </div>
  );
}
