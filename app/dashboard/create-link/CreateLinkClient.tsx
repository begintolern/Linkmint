"use client";

import { useState } from "react";
import Link from "next/link";

export default function CreateLinkClient() {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState(""); // optional smart link title
  const [source, setSource] = useState(""); // traffic source (optional unless merchant needs it)
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
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
          url,
          // optional smart link title (uses existing SmartLink.label in schema)
          label: label || undefined,
          // send source if selected; backend will require it only for merchants that need it
          source: source || undefined,
        }),
      });

      const json = await res.json();
      setResult(json);
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

  return (
    <div className="space-y-6">
      {/* Top nav */}
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-lg font-semibold">Create Smart Link</h2>
        <div className="flex items-center gap-2">
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
        {/* Title / label (optional) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">
            Smart link title <span className="text-xs text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Mom’s gift – Lazada, TikTok video #1, Havaianas promo..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
            maxLength={120}
          />
          <p className="text-xs text-gray-500">
            This is just for you. It won’t change tracking — it helps you remember what this link is for.
          </p>
        </div>

        <input
          type="url"
          placeholder="Paste product URL (Shopee, Lazada, Zalora, etc.)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border rounded-lg p-3 text-sm"
          required
        />

        {/* Traffic source */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">
            Traffic source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm bg-white"
          >
            <option value="">Select where you’ll share this</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="youtube">YouTube</option>
            <option value="other">Other / mixed</option>
          </select>
          <p className="text-xs text-gray-500">
            Some merchants only allow certain platforms. If required, we’ll use
            this to block risky traffic and keep your account safe.
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

      {/* Result */}
      {result && result.ok && (
        <div className="p-4 border rounded-md bg-white shadow-sm space-y-3">
          <div className="space-y-1">
            <p className="font-medium text-sm">Your link is ready:</p>
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all text-sm"
            >
              {result.link}
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => copyToClipboard(result.link)}
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
      <div className="border-t pt-3 text-sm text-gray-600 flex items-center justify-between">
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
