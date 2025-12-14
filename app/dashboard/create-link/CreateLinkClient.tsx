"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CreateLinkClient() {
  const sp = useSearchParams();
  const merchant = (sp?.get("merchant") ?? "").trim();

  const showTemuRules = merchant === "temu-global";
  const showAliRules = merchant === "aliexpress-global";
  const showSheinRules = merchant === "shein-global";

  const [url, setUrl] = useState("");
  const [source, setSource] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState<null | "ok" | "err">(null);

  // Reset when merchant changes
  useEffect(() => {
    setUrl("");
    setSource("");
    setLabel("");
    setResult(null);
    setCopied(null);
  }, [merchant]);

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
          source: source || undefined,
          label: label.trim() || undefined,
        }),
      });

      const json = await res.json();
      setResult(json);
    } catch {
      alert("Something went wrong creating your link.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied("err");
      setTimeout(() => setCopied(null), 2000);
    }
  }

  function resetForm() {
    setUrl("");
    setSource("");
    setLabel("");
    setResult(null);
    setCopied(null);
  }

  return (
    <div key={merchant} className="space-y-6">
      {/* Top nav */}
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Create Smart Link
        </h2>
        <div className="flex gap-2">
          <Link href="/dashboard" className="px-3 py-1.5 border rounded-md">
            ← Dashboard
          </Link>
          <Link href="/dashboard/links" className="px-3 py-1.5 border rounded-md">
            View Links
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Optional label */}
        <input
          type="text"
          placeholder="Optional link label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full border rounded-lg p-3 text-sm"
        />

        <input
          type="url"
          placeholder="Paste product URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border rounded-lg p-3 text-sm"
          required
        />

        {/* ================= MERCHANT RULES ================= */}

        {(showTemuRules || showAliRules || showSheinRules) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-slate-800">
            {showTemuRules && (
              <>
                <p className="font-semibold text-slate-900">
                  Temu links — important
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Homepage landing is normal (no item deep links)</li>
                  <li>Cookie-based session tracking</li>
                  <li>Multiple items may earn commission</li>
                  <li>US buyer + US delivery only</li>
                  <li>Refunds and cancellations do not qualify</li>
                </ul>
              </>
            )}

            {showAliRules && (
              <>
                <p className="font-semibold text-slate-900">
                  AliExpress links — important
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Session/cookie-based tracking</li>
                  <li>No coupon spam or cashback claims</li>
                  <li>Some items or campaigns may be excluded</li>
                  <li>Refunds and cancellations do not qualify</li>
                </ul>
              </>
            )}

            {showSheinRules && (
              <>
                <p className="font-semibold text-slate-900">
                  SHEIN links — important
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Organic traffic only</li>
                  <li>Hauls, try-ons, and reviews perform best</li>
                  <li>No incentive or coupon aggregation traffic</li>
                  <li>Refunds and cancellations do not qualify</li>
                </ul>
              </>
            )}

            <p className="mt-2 text-[10px] text-slate-700">
              Merchant controls tracking and approval. linkmint.co cannot override
              official program rules.
            </p>
          </div>
        )}

        {/* Traffic source */}
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm"
        >
          <option value="">Select traffic source</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="youtube">YouTube</option>
          <option value="other">Other</option>
        </select>

        <button
          disabled={loading}
          className="bg-teal-600 text-white px-4 py-2 rounded-md"
        >
          {loading ? "Creating..." : "Create Smart Link"}
        </button>
      </form>

      {/* Result */}
      {result && result.ok && (
        <div className="p-4 border rounded-md bg-white space-y-3">
          <a
            href={result.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 break-all text-sm"
          >
            {result.link}
          </a>

          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(result.link)}
              className="px-3 py-1.5 border rounded-md text-sm"
            >
              Copy
            </button>
            <button
              onClick={resetForm}
              className="px-3 py-1.5 border rounded-md text-sm"
            >
              Create another
            </button>
          </div>

          {copied === "ok" && (
            <div className="text-xs text-emerald-700">Link copied.</div>
          )}
          {copied === "err" && (
            <div className="text-xs text-rose-700">
              Couldn’t copy automatically.
            </div>
          )}
        </div>
      )}

      <div className="border-t pt-3 text-sm text-gray-600 flex justify-between">
        <span>Need help?</span>
        <Link href="/tutorial" className="px-3 py-1.5 border rounded-md">
          Open Tutorial
        </Link>
      </div>
    </div>
  );
}
