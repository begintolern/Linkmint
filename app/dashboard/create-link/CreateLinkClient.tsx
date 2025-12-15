"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import InfoTooltip from "../_components/InfoTooltip";

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
    setSource("");
    setLabel("");
    setResult(null);
    setCopied(null);
  }

  return (
    <div key={merchant} className="space-y-6">
      {/* Top nav */}
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-lg font-semibold text-gray-900">Create Smart Link</h2>
        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 border rounded-md text-sm text-gray-900 bg-white hover:bg-gray-50"
          >
            ← Dashboard
          </Link>
          <Link
            href="/dashboard/links"
            className="px-3 py-1.5 border rounded-md text-sm text-gray-900 bg-white hover:bg-gray-50"
          >
            View Links
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Optional label */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-900">
            Smart link title{" "}
            <span className="text-xs font-normal text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Mom’s gift — Lazada, TikTok video #1, Temu haul"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white"
          />
          <p className="text-xs text-gray-500">
            This is just for you. It won’t change tracking — it helps you remember what
            this link is for.
          </p>
        </div>

        {/* URL + tracking tooltip */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-900">Paste product URL</label>
            <InfoTooltip text="For best tracking: avoid opening links inside shopping apps, don’t switch devices, and complete checkout in the same session. App redirects or delayed purchases may not track." />
          </div>

          <input
            type="url"
            placeholder="Paste product URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white"
            required
          />
        </div>

        {/* ================= MERCHANT RULES ================= */}
        {(showTemuRules || showAliRules || showSheinRules) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-slate-800">
            {showTemuRules && (
              <>
                <p className="font-semibold text-slate-900">Temu links — important</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>
                    Landing on the <strong>item page</strong> is normal (Temu controls
                    redirects).
                  </li>
                  <li>
                    Tracking is <strong>session/cookie-based</strong>.
                  </li>
                  <li>
                    If Temu opens in the <strong>Temu app</strong>, tracking may be lost.
                    For best results, complete checkout in the{" "}
                    <strong>browser</strong>.
                  </li>
                  <li>
                    If the buyer purchases multiple items in the same session, commissions
                    may apply to <strong>all eligible items</strong>.
                  </li>
                  <li>
                    <strong>US buyer + US delivery</strong> only.
                  </li>
                  <li>
                    Refunded or canceled orders do <strong>not</strong> qualify.
                  </li>
                </ul>
              </>
            )}

            {showAliRules && (
              <>
                <p className="font-semibold text-slate-900">AliExpress links — important</p>
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
                <p className="font-semibold text-slate-900">SHEIN links — important</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Organic traffic only</li>
                  <li>Hauls, try-ons, and reviews perform best</li>
                  <li>No incentive or coupon aggregation traffic</li>
                  <li>Refunds and cancellations do not qualify</li>
                </ul>
              </>
            )}

            <p className="mt-2 text-[10px] text-slate-700">
              Merchant controls tracking and approval. linkmint.co cannot override official
              program rules.
            </p>
          </div>
        )}

        {/* Traffic source */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-900">Traffic source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm text-gray-900 bg-white"
          >
            <option value="">Select traffic source</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="youtube">YouTube</option>
            <option value="other">Other</option>
          </select>
          <p className="text-xs text-gray-500">
            Some merchants only allow certain platforms. If required, we’ll use this to
            block risky traffic and keep your account safe.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Smart Link"}
        </button>
      </form>

      {/* Result */}
      {result && result.ok && (
        <div className="p-4 border rounded-md bg-white shadow-sm space-y-3">
          <div className="space-y-1">
            <p className="font-medium text-sm text-gray-900">Your link is ready:</p>
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 break-all text-sm hover:underline"
            >
              {result.link}
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => copyToClipboard(result.link)}
              className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50"
            >
              Copy
            </button>
            <Link
              href="/dashboard/links"
              className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50"
            >
              Go to Links
            </Link>
            <button
              onClick={resetForm}
              className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50"
            >
              Create another
            </button>
          </div>

          {copied === "ok" && <div className="text-xs text-emerald-700">Link copied.</div>}
          {copied === "err" && (
            <div className="text-xs text-rose-700">Couldn’t copy automatically.</div>
          )}
        </div>
      )}

      <div className="border-t pt-3 text-sm text-gray-600 flex justify-between items-center">
        <span>Need help?</span>
        <Link href="/tutorial" className="px-3 py-1.5 border rounded-md hover:bg-gray-50">
          Open Tutorial
        </Link>
      </div>
    </div>
  );
}
