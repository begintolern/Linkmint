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

export default function PolicyCheckClient() {
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
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Policy Pre-Check (AI-assisted)</h1>
          <p className="text-sm text-gray-600 mt-1">
            Paste your link title/description. We’ll flag common merchant/network risks
            (gift cards, coupon stacking, self-purchase, etc.). Results are suggestions—not legal advice.
          </p>
        </header>

        <div className="rounded-2xl border bg-white p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium">Title (optional)</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="e.g., 20% off at Example Store — fall sale"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Description or caption</label>
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm min-h-[120px]"
              placeholder="What will you post/share? Include coupon terms if any."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runCheck}
              disabled={busy || (!title && !description)}
              className="px-4 py-2 rounded-2xl border text-sm disabled:opacity-60"
            >
              {busy ? "Checking…" : "Run Policy Check"}
            </button>
            <div className="text-xs text-gray-500">
              AI mode is {process.env.NEXT_PUBLIC_AI_POLICY_BADGE === "1" ? "ON" : "auto (env-controlled)"}.
            </div>
          </div>
        </div>

        {err && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {resp && (
          <div className="rounded-2xl border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-xs ${sevColor}`}>
                <span className="font-semibold">Severity:</span>
                <span>{sev}</span>
              </div>
              <div className="text-xs text-gray-500">
                Engine: {resp.usedLLM ? "LLM + heuristics" : "Heuristics"}
              </div>
            </div>

            {resp.assessment?.categories?.length ? (
              <div>
                <div className="text-sm font-medium">Categories</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {resp.assessment.categories.map((c) => (
                    <span key={c} className="rounded-lg border bg-gray-50 px-2 py-1 text-xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {resp.assessment?.findings?.length ? (
              <div>
                <div className="text-sm font-medium">Findings</div>
                <ul className="mt-1 list-disc pl-5 text-sm text-gray-800">
                  {resp.assessment.findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No common risks detected.</p>
            )}

            {resp.assessment?.suggestions?.length ? (
              <div>
                <div className="text-sm font-medium">Suggestions</div>
                <ul className="mt-1 list-disc pl-5 text-sm text-gray-800">
                  {resp.assessment.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {resp.inputEcho?.textLen !== undefined && (
              <div className="text-xs text-gray-500">
                Analyzed characters: {resp.inputEcho.textLen}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
