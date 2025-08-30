// components/dashboard/SmartLinkGenerator.tsx
"use client";

import { useState } from "react";

type GenerateResp =
  | { ok: true; link?: string; smartLink?: string }
  | { ok: false; error: string };

export default function SmartLinkGenerator() {
  const [program, setProgram] = useState<"amazon" | "cj">("amazon");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onGenerate() {
    setCopied(false);
    setError(null);
    setResult(null);

    // basic validation
    if (!url.trim()) {
      setError("Paste a product URL first.");
      return;
    }
    try {
      new URL(url); // throws if invalid
    } catch {
      setError("That doesn’t look like a valid URL.");
      return;
    }

    setLoading(true);
    try {
      // Backend already implemented: POST /api/smartlink
      // Accepts { url, program }, returns { ok: true, link }.
      const res = await fetch("/api/smartlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, program }),
      });

      const json = (await res.json()) as GenerateResp;

      if (!res.ok || !("ok" in json) || json.ok === false) {
        setError(
          (json as any)?.error ??
            `Failed to generate link (HTTP ${res.status}).`
        );
        return;
      }

      const link = json.link ?? (json as any).smartLink ?? null;
      if (!link) {
        setError("Generation succeeded but no link was returned.");
        return;
      }
      setResult(link);
    } catch (e: any) {
      setError(e?.message ?? "Network error while generating link.");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Generate Smart Link</h2>
        <select
          value={program}
          onChange={(e) => setProgram(e.target.value as any)}
          className="rounded-lg border px-2 py-1 text-sm"
          aria-label="Affiliate program"
        >
          <option value="amazon">Amazon Associates</option>
          <option value="cj">CJ Affiliate</option>
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm text-gray-700">
          Paste a product URL from {program === "amazon" ? "Amazon" : "a CJ partner"}:
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.amazon.com/…  or  https://www.merchant.com/product/…"
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={onGenerate}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate"}
          </button>

          {error && (
            <span className="text-sm text-red-600" role="alert">
              {error}
            </span>
          )}
        </div>

        {result && (
          <div className="mt-2 grid gap-2">
            <label className="text-sm text-gray-700">Your smart link:</label>
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={result}
                className="w-full rounded-xl border px-3 py-2 text-sm bg-gray-50"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={onCopy}
                className="whitespace-nowrap rounded-xl border px-3 py-2 text-sm"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
