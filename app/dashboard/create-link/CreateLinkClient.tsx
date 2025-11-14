"use client";

import { useState } from "react";
import Link from "next/link";

export default function CreateLinkClient() {
  const [url, setUrl] = useState("");
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
        body: JSON.stringify({ url }),
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
        // fallback
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
    setResult(null);
    setCopied(null);
  }

  // 🔍 Detect Shopee merchant for UX note
  const isShopee =
    result &&
    (result as any).merchant &&
    typeof (result as any).merchant.name === "string" &&
    (result as any).merchant.name.toLowerCase().includes("shopee");

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
        <input
          type="url"
          placeholder="Paste product URL (Shopee, Lazada, etc.)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border rounded-lg p-3 text-sm"
          required
        />
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

            {/* 🟡 Shopee UX note */}
            {isShopee && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                Note: Shopee may ask people to log in before they see the full
                product page. That&apos;s normal for Shopee and does not stop
                your commissions as long as they buy through your link.
              </p>
            )}
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

          {/* tiny inline toast */}
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
