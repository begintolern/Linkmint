"use client";

import { useEffect, useState } from "react";

/** Store a created link in localStorage so it persists across refreshes. */
function rememberLink(row: { id: string; shortUrl: string; targetUrl: string }) {
  try {
    const key = "lm_links";
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    const now = new Date().toISOString();
    const rec = { ...row, createdAt: now, clicks: 0, earningsCents: null };
    const next = [rec, ...prev].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(next));
    localStorage.setItem("lm_last_link_value", row.shortUrl);
  } catch {
    // ignore localStorage errors
  }
}

export default function SmartLinkGenerator() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);

  // Restore the "last created" link on mount so it shows after refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lm_last_link_value");
      if (saved) setLast(saved);
    } catch {
      // ignore
    }
  }, []);

  async function onGenerate() {
    if (!url) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/smartlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();

      if (!json?.ok) {
        throw new Error(json?.error || "Failed to create smart link");
      }

      const smart = (json.smartLink as string) || (json.link as string);
      if (!smart) throw new Error("No link returned from API");

      // Update UI
      setLast(smart);
      setUrl("");
      setMsg("Link created!");

      // Persist locally so it appears in /links table even without DB rows
      console.log("Saving to localStorage:", smart);

rememberLink({
  id: crypto.randomUUID(),
  shortUrl: smart,
  targetUrl: url,
});

    } catch (e: any) {
      setMsg(e?.message || "Error creating link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Create Smart Link</h3>
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Paste a product URL (Amazon or CJ)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="rounded bg-indigo-600 text-white px-4 py-2 disabled:opacity-50"
          onClick={onGenerate}
          disabled={!url || busy}
        >
          {busy ? "Generating..." : "Generate"}
        </button>
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      {last && (
        <div className="rounded border p-3 text-sm flex items-center justify-between">
          <div className="truncate mr-2">{last}</div>
          <button
            className="rounded bg-gray-800 text-white px-3 py-1"
            onClick={() => navigator.clipboard.writeText(last)}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
