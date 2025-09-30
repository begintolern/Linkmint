// app/admin/ops/AdminOpsClient.tsx
"use client";
import { useEffect, useState } from "react";

export default function AdminOpsClient() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    try {
      const r = await fetch("/api/ops/health", { cache: "no-store" });
      const j = await r.json();
      setHealth(j.health);
    } catch {
      setMsg("Failed to load health");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function act(action: string) {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/ops/self-heal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await r.json();
      setMsg(JSON.stringify(j));
      await refresh();
    } catch {
      setMsg("Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function sendHeartbeatNow() {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/ops/heartbeat", { method: "POST" });
      const j = await r.json();
      setMsg(JSON.stringify(j));
    } catch {
      setMsg("Heartbeat failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Admin Ops Console</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4">
          <div className="text-lg font-medium mb-2">Health</div>
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>

        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-lg font-medium mb-2">Actions</div>
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-2 rounded-2xl border"
              disabled={loading}
              onClick={() => act("DISABLE_AUTO_PAYOUT")}
            >
              Disable Auto-Payout
            </button>
            <button
              className="px-3 py-2 rounded-2xl border"
              disabled={loading}
              onClick={() => act("ENABLE_AUTO_PAYOUT")}
            >
              Enable Auto-Payout
            </button>
            <button
              className="px-3 py-2 rounded-2xl border"
              disabled={loading}
              onClick={() => act("RETRY_STUCK_PAYOUTS")}
            >
              Retry Stuck Payouts
            </button>
            <button
              className="px-3 py-2 rounded-2xl border"
              disabled={loading}
              onClick={() => act("CLEAR_ZOMBIE_TOKENS")}
            >
              Clear Zombie Tokens
            </button>
            <button
              className="px-3 py-2 rounded-2xl border"
              disabled={loading}
              onClick={() => act("TRIM_EVENTLOG")}
            >
              Trim EventLog
            </button>
            <button
              className="px-3 py-2 rounded-2xl border"
              disabled={loading}
              onClick={sendHeartbeatNow}
            >
              Send Heartbeat Now
            </button>
          </div>
          {msg && <div className="text-sm text-gray-600">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
