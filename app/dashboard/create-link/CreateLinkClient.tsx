"use client";

import { useState } from "react";
import Link from "next/link";

type ResultPayload = {
  ok?: boolean;
  link?: string;
  shortUrl?: string;
  error?: string;
  warning?: string;
  reason?: string;
  merchant?: {
    id?: string;
    name?: string;
    status?: string;
    market?: string | null;
  };
};

export default function CreateLinkClient() {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [copied, setCopied] = useState<null | "ok" | "err">(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setCopied(null);

    try {
      const res = await fetch("/api/smartlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          label: label.trim() || undefined,
          source: source.trim() || undefined,
        }),
      });

      const json = (await res.json()) as ResultPayload;
      setResult(json);
      if (!res.ok || !json.ok) {
        // surface basic error
        console.error("Smartlink error:", json);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong creating your link.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied("ok");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied("err");
      setTimeout(() => setCopied(null), 2000);
    }
  }

  function resetForm() {
    setUrl("");
    setLabel("");
    setSource("");
    setResult(null);
    setCopied(null);
  }

  const finalLink = result?.link || result?.shortUrl || "";

  return (
    <div className="space-y-6">
      {/* Top nav */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <h2 className="text-lg font-semibold">Create Smart Link</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
          >
            ← Dashboard
          </Link>
          <Link
            href="/dashboard/links"
            className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
          >
            View Links
          </Link>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">
            Product URL
          </label>
          <input
            type="url"
            placeholder="Paste product URL (Shopee, Lazada, Zalora, etc.)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm"
            required
          />
        </div>

        {/* Label (optional) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">
            Link label <span className="text-xs text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="For your eyes only (e.g. “Nike AF1 TikTok video #1”)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm"
          />
        </div>

        {/* Source / traffic channel */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">
            Traffic source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm bg-white"
          >
            <option value="">Select where you’ll share this</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">X / Twitter</option>
            <option value="reddit">Reddit</option>
            <option value="blog">Blog / website</option>
            <option value="other">Other</option>
          </select>
          <p className="text-xs text-gray-500">
            Some merchants only allow certain platforms. If required, we’ll use this
            to block risky traffic and keep your account safe.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Smart Link"}
        </button>
      </form>

      {/* Error state (API-level) */}
      {result && !result.ok && (
        <div className="p-4 border border-rose-200 rounded-md bg-rose-50 text-sm text-rose-800 space-y-1">
          <div className="font-medium">Couldn’t create this link.</div>
          {result.reason && <div>{result.reason}</div>}
          {!result.reason && result.error && <div>{result.error}</div>}
          {result.merchant?.name && (
            <div className="text-xs opacity-80">
              Merchant: {result.merchant.name}
              {result.merchant.status ? ` · Status: ${result.merchant.status}` : ""}
              {result.merchant.market ? ` · Market: ${result.merchant.market}` : ""}
            </div>
          )}
        </div>
      )}

      {/* Success result */}
      {result && result.ok && finalLink && (
        <div className="p-4 border rounded-md bg-white shadow-sm space-y-3">
          <div className="space-y-1">
            <p className="font-medium text-sm">Your link is ready:</p>
            <a
              href={finalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all text-sm"
            >
              {finalLink}
            </a>
            {result.warning && (
              <p className="text-xs text-amber-700 mt-1">{result.warning}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(finalLink)}
              className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
            >
              Copy
            </button>
            <Link
              href="/dashboard/links"
              className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
            >
              Go to Links
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
            >
              Create another
            </button>
          </div>

          {copied === "ok" && (
            <div className="text-xs text-emerald-700">Link copied.</div>
          )}
          {copied === "err" && (
            <div className="text-xs text-rose-700">
              Couldn’t copy automatically—select the link and copy.
            </div>
          )}
        </div>
      )}

      {/* Footer helper */}
      <div className="border-t pt-3 text-sm text-gray-600 flex items-center justify-between flex-wrap gap-2">
        <span className="opacity-80">Need help creating links?</span>
        <Link
          href="/tutorial"
          className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
        >
          Open Tutorial
        </Link>
      </div>
    </div>
  );
}
