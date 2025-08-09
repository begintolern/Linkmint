"use client";
import { useEffect, useState } from "react";

export default function SystemHealthCard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/health", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Health check failed");
        setData(json);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, []);

  return (
    <div className="border rounded-md p-4">
      <h3 className="text-lg font-semibold mb-1">System Health</h3>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {data && (
        <ul className="text-sm text-gray-700 list-disc ml-4">
          <li>DB: {data.db}</li>
          <li>Env missing: {data.envMissing?.length ? data.envMissing.join(", ") : "none"}</li>
        </ul>
      )}
    </div>
  );
}
