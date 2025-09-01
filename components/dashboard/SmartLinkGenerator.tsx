"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type SavedRow = {
  id: string;
  createdAt: string;
  shortUrl: string | null;
  targetUrl: string | null;
  clicks?: number | null;
  earningsCents?: number | null;
};

export default function SmartLinkGenerator() {
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  // Restore the last created link so the box shows after refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lm_last_link_value");
      if (saved) setLast(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function rememberLink(entry: SavedRow) {
    try {
      const raw = localStorage.getItem("lm_links");
      const arr: SavedRow[] = raw ? JSON.parse(raw) : [];
      // put newest first, dedupe by shortUrl
      const byKey = new Map<string, SavedRow>();
      const key = entry.shortUrl ?? `local-${entry.id}`;
      byKey.set(key, entry);
      for (const r of arr) {
        const k = r.shortUrl ?? `local-${r.id}`;
        if (!byKey.has(k)) byKey.set(k, r);
      }
      const merged = Array.from(byKey.values()).slice(0, 50);
      localStorage.setItem("lm_links", JSON.stringify(merged));
    } catch {
      /* ignore */
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const raw = url.trim();
    if (!raw) {
      toast.error("Please paste a URL");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/smartlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "Failed to create link");

      const smart: string = json.smartLink || json.link;
      if (!smart) throw new Error("No link returned");

      // save "last" so the created box updates
      setLast(smart);
      try {
        localStorage.setItem("lm_last_link_value", smart);
      } catch {}

      // persist to list so /dashboard/links (or /links) table sees it
      rememberLink({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        shortUrl: smart,
        targetUrl: raw,
        clicks: 0,
        earningsCents: null,
      });

      setUrl("");
      toast.success("Smart link created!");
    } catch (err: any) {
      toast.error(err?.message || "Error creating link");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={handleCreate}
        className="rounded-lg border bg-white p-4 shadow-sm flex gap-3"
      >
        <input
          type="url"
          placeholder="Paste a product URL (Amazon, CJ, etc.)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </form>

      {/* Created box */}
      {last ? (
        <div className="rounded-lg border bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm text-gray-600">Created</div>
            <a
              href={last}
              target="_blank"
              rel="noreferrer"
              className="block font-medium underline truncate max-w-[640px]"
              title={last}
            >
              {last}
            </a>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(last);
              toast.success("Link copied");
            }}
            className="rounded bg-gray-800 text-white px-3 py-2 text-sm"
          >
            Copy
          </button>
        </div>
      ) : null}
    </div>
  );
}
