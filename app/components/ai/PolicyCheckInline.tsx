// app/components/ai/PolicyCheckInline.tsx
"use client";

import { useState } from "react";

type Assessment = {
  ok: boolean;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | string;
  categories: string[];
  findings: string[];
  suggestions?: string[];
};

export default function PolicyCheckInline({
  getText,
}: {
  getText: () => { title?: string; description?: string };
}) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ severity: string; findings: string[]; usedLLM: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    setRes(null);
    try {
      const { title, description } = getText();
      const r = await fetch("/api/ai/policy-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const j = await r.json();
      if (!j?.ok) {
        setErr(j?.message || j?.error || "Policy check failed");
      } else {
        setRes({
          severity: j.assessment?.severity || "NONE",
          findings: j.assessment?.findings || [],
          usedLLM: !!j.usedLLM,
        });
      }
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  const sev = (res?.severity || "NONE").toUpperCase();
  const chip =
    sev === "HIGH" ? "bg-red-100 text-red-700 border-red-300" :
    sev === "MEDIUM" ? "bg-amber-100 text-amber-700 border-amber-300" :
    sev === "LOW" ? "bg-emerald-100 text-emerald-700 border-emerald-300" :
    "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <div className="mt-2 rounded-xl border p-3 space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-60"
        >
          {busy ? "Checking…" : "Check compliance (AI)"}
        </button>
        {res && (
          <span className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs ${chip}`}>
            <span className="font-semibold">Severity:</span> {sev}
            <span className="text-gray-500">· {res.usedLLM ? "LLM+heuristics" : "Heuristics"}</span>
          </span>
        )}
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      {!!res?.findings?.length && (
        <ul className="list-disc pl-5 text-sm text-gray-800">
          {res.findings.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      )}
      {res && res.findings.length === 0 && (
        <p className="text-sm text-gray-600">No common risks detected.</p>
      )}
    </div>
  );
}
