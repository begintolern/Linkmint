"use client";

import { useState, useEffect } from "react";

export default function SmartLinkGenerator() {
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastLink, setLastLink] = useState<string>("");
  const [regionsNote, setRegionsNote] = useState<string>("");
  const [warning, setWarning] = useState<string>("");

  function looksLikeUrl(u: string) {
    try {
      const hasProto = /^https?:\/\//i.test(u.trim());
      const test = hasProto ? u.trim() : `https://${u.trim()}`;
      const parsed = new URL(test);
      return !!parsed.hostname && parsed.hostname.includes(".");
    } catch {
      return false;
    }
  }

  async function handleCreate() {
    if (!looksLikeUrl(url)) {
      setError("Please enter a valid product URL (e.g. https://example.com/item).");
      return;
    }

    setCreating(true);
    setError("");
    setWarning("");
    setRegionsNote("");
    setLastLink("");

    try {
      const res = await fetch("/api/smartlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        // Show exact server error (e.g., merchant unavailable / pending / inactive)
        setError(data?.error || "Failed to create smart link.");
        if (data?.regionsNote) setRegionsNote(String(data.regionsNote));
        return;
      }

      const out =
        data?.link || data?.url || data?.shortUrl || data?.smartUrl || "";
      if (!out) {
        setError("Smart link created but no URL returned.");
        return;
      }

      setLastLink(out);
      setUrl("");

      if (data?.regionsNote) setRegionsNote(String(data.regionsNote));
      if (data?.warning) setWarning(String(data.warning));

      // Tell history to refresh
      window.dispatchEvent(new CustomEvent("smartlink:created"));
    } catch {
      setError("Network error while creating the smart link.");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
      <div className="text-sm text-gray-600">
        Paste a product URL from a merchant site and create a trackable Smart Link.
      </div>

      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://merchant.com/product/123"
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !looksLikeUrl(url)}
          className={`rounded-lg px-4 py-2 text-white text-sm ${
            creating || !looksLikeUrl(url)
              ? "bg-blue-600 opacity-60 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {creating ? "Creating…" : "Create Smart Link"}
        </button>
      </div>

      {/* Error from API (e.g., merchant inactive/pending) */}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {/* Regions note (e.g., “Commissions valid only in: US”) */}
      {regionsNote ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
          {regionsNote}
        </div>
      ) : null}

      {/* Generic warning (e.g., no matching merchant rule) */}
      {warning ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
          {warning}
        </div>
      ) : null}

      {lastLink ? (
        <div className="rounded-md border p-2 flex items-center justify-between">
          <input
            readOnly
            value={lastLink}
            className="flex-1 rounded-lg border px-3 py-2 text-sm mr-2"
          />
          <button
            onClick={() => navigator.clipboard.writeText(lastLink)}
            className="rounded bg-gray-900 text-white text-xs px-2 py-1"
          >
            Copy
          </button>
          <a
            href={lastLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 rounded border text-xs px-2 py-1"
          >
            Open
          </a>
        </div>
      ) : null}
    </div>
  );
}
