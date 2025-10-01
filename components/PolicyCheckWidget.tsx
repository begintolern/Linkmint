// components/PolicyCheckWidget.tsx
"use client";

import { useState } from "react";

type Assessment = {
  ok: boolean;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | string;
  categories: string[];
  findings: string[];
  suggestions?: string[];
};

type Resp = {
  ok: boolean;
  assessment?: Assessment;
  inputEcho?: { title?: string; description?: string; textLen?: number };
  usedLLM?: boolean;
  error?: string;
  message?: string;
};

export default function PolicyCheckWidget() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function runCheck() {
    setBusy(true);
    setErr(null);
    setResp(null);
    try {
      const r = await fetch("/api/ai/policy-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const j: Resp = await r.json();
      if (!j.ok) {
        setErr(j.message || j.error || "Policy check failed");
      } else {
        setResp(j);
      }
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  const sev = resp?.assessment?.severity || "NONE";
  const sevColor =
    sev === "HIGH"
      ? "bg-red-100 text-red-700 border-red-300"
      : sev === "MEDIUM"
      ? "bg-amber-100 text-amber-700 border-amber-300"
      : sev === "LOW"
      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
      : "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <p className="text-sm text-gray-600">
        Paste your link text here and run a quick AI-assisted compliance check.
      </p>

      <input
        className="w-full rounded-md border px-3 py-2 text-sm"
        placeholder="Optional: Link title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
        placeholder="Description, coupon, or caption text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button
        onClick={runCheck}
        disabled={busy || (!title && !description)}
        className="px-4 py-2 rounded-lg border text-sm disabled:opacity-60"
      >
        {busy ? "Checking…" : "Run Check"}
      </button>

      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {resp && (
        <div className="rounded-lg border bg-gray-50 p-3 space-y-2 text-sm">
          <div className={`inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-xs ${sevColor}`}>
            <span className="font-semibold">Severity:</span>
            <span>{sev}</span>
          </div>
          {resp.assessment?.findings?.length ? (
            <ul className="list-disc pl-4">
              {resp.assessment.findings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p>No common risks detected.</p>
          )}
        </div>
      )}
    </div>
  );
}
