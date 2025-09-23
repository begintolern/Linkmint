"use client";

import { useState } from "react";

type Props = {
  defaultSource?: string; // e.g., "tiktok"
};

export default function CreateSmartLinkForm({ defaultSource = "" }: Props) {
  const [merchant, setMerchant] = useState("");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [source, setSource] = useState(defaultSource);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);

    // Basic validation
    if (!url.trim()) {
      setError("Please paste a product URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/smartlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          label: label.trim() || undefined,
          // NOTE: we don’t persist `source` yet, but backend validates it if merchant defines allow/deny
          source: source.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.reason || data?.error || "Failed to create smart link.");
      } else {
        setMsg(`Smart link created: ${data?.shortUrl || data?.link || "OK"}`);
        // Optional: clear inputs except merchant
        // setUrl(""); setLabel("");
      }
    } catch (err: any) {
      setError(err?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium">Merchant name</label>
        <input
          type="text"
          placeholder="e.g., Lazada"
          className="w-full rounded-md border px-3 py-2 text-sm"
          name="merchant"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Product / URL</label>
        <input
          type="url"
          placeholder="Paste product URL (e.g., https://www.lazada.com.ph/...)"
          className="w-full rounded-md border px-3 py-2 text-sm"
          name="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
        <input
          type="text"
          placeholder="Internal note"
          className="w-full rounded-md border px-3 py-2 text-sm"
          name="note"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium">Traffic source (optional)</label>
        <input
          type="text"
          placeholder='e.g., "tiktok", "instagram", "facebook", "youtube"'
          className="w-full rounded-md border px-3 py-2 text-sm"
          name="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <p className="mt-1 text-xs text-gray-500">
          If a merchant defines allowed/disallowed sources, this is required.
        </p>
      </div>

      <div className="md:col-span-2 mt-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Creating…" : "Create Smart Link"}
        </button>
      </div>

      {msg && (
        <div className="md:col-span-2 rounded-md border border-green-200 bg-green-50 p-2 text-sm text-green-800">
          {msg}
        </div>
      )}
      {error && (
        <div className="md:col-span-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </div>
      )}
    </form>
  );
}
