"use client";

import { useState } from "react";
import Toast from "@/components/Toast";

type Props = {
  defaultSource?: string; // e.g., "tiktok"
};

export default function CreateSmartLinkForm({ defaultSource = "" }: Props) {
  const [merchant, setMerchant] = useState("");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [source, setSource] = useState(defaultSource);
  const [loading, setLoading] = useState(false);

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastKind, setToastKind] = useState<"success" | "error" | "info">("success");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // keep the last created short link so the toast can copy it
  const [lastShortUrl, setLastShortUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!url.trim()) {
      setToastKind("error");
      setToastMsg("Please paste a product URL.");
      setLastShortUrl(null);
      setToastOpen(true);
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
          source: source.trim() || undefined, // validated server-side if merchant defines allow/deny
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const reason = data?.reason || data?.error || "Failed to create smart link.";
        setToastKind("error");
        setToastMsg(reason);
        setLastShortUrl(null);
        setToastOpen(true);
      } else {
        const short = data?.shortUrl || data?.link || "Smart link created.";
        setToastKind("success");
        setToastMsg(short);
        setLastShortUrl(typeof short === "string" ? short : null);
        setToastOpen(true);

        // Optional: clear some fields on success
        // setUrl(""); setLabel("");
      }
    } catch (err: any) {
      setToastKind("error");
      setToastMsg(err?.message || "Network error.");
      setLastShortUrl(null);
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    const text = lastShortUrl || "";
    try {
      if (!text) return;
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: temp textarea
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setToastKind("success");
      setToastMsg("Copied link to clipboard!");
      setToastOpen(true);
    } catch {
      setToastKind("error");
      setToastMsg("Could not copy. Please copy manually.");
      setToastOpen(true);
    }
  }

  return (
    <>
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
      </form>

      <Toast
        open={toastOpen}
        kind={toastKind}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
        actionLabel={lastShortUrl ? "Copy link" : undefined}
        onAction={lastShortUrl ? handleCopy : undefined}
      />
    </>
  );
}
