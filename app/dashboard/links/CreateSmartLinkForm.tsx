/* eslint-disable react-hooks/rules-of-hooks */

"use client";

import React from "react";

type Props = {
  defaultSource?: string;
};

type Suggestion = {
  id: string;
  title: string;
  merchant: string;
  url: string;
  caption: string;
  badge?: "Trending" | "Price Drop" | "Expiring";
};

type PolicyAssessment = {
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | string;
  categories?: string[];
  findings?: string[];
  suggestions?: string[];
};

type PolicyResp = {
  ok: boolean;
  assessment?: PolicyAssessment;
  usedLLM?: boolean;
  message?: string;
  error?: string;
};

// Static sample suggestions for now (feed later)
const SUGGESTIONS: Suggestion[] = [
  {
    id: "opp-1",
    title: "20% Off Running Shoes",
    merchant: "Example Store",
    url: "https://examplestore.com/shoes/running",
    caption:
      "Heads up: 20% off select running shoes at checkout. Excludes gift cards and some brands.",
    badge: "Trending",
  },
  {
    id: "opp-2",
    title: "Pet Supplies — up to 30% off",
    merchant: "PetMart",
    url: "https://petmart.com/sale",
    caption:
      "Pet supplies sale (up to 30% off). Availability varies; coupons may not stack.",
    badge: "Price Drop",
  },
  {
    id: "opp-3",
    title: "Travel Deals — hotels & flights",
    merchant: "TravelNow",
    url: "https://travelnow.example/deals",
    caption:
      "Travel deals live now. Bookings must be completed after clicking this link.",
    badge: "Expiring",
  },
];

export default function CreateSmartLinkForm({ defaultSource = "" }: Props) {
  const [sourceUrl, setSourceUrl] = React.useState(defaultSource);
  const [caption, setCaption] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = React.useState<string | null>(null);

  // Policy state
  const [policy, setPolicy] = React.useState<{
    severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | string;
    categories?: string[];
    findings?: string[];
    suggestions?: string[];
    usedLLM?: boolean;
  } | null>(null);

  function useSuggestion(s: Suggestion) {
    setSourceUrl(s.url);
    setCaption(s.caption);
    setMsg(null);
    setCreatedUrl(null);
    setPolicy(null);
  }

  async function runPolicyCheck(input: { title?: string; description?: string }): Promise<PolicyAssessment | null> {
    try {
      const r = await fetch("/api/ai/policy-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const j: PolicyResp = await r.json();
      if (j?.assessment) {
        const a = j.assessment;
        setPolicy({
          severity: a.severity,
          categories: a.categories,
          findings: a.findings,
          suggestions: a.suggestions,
          usedLLM: j.usedLLM,
        });
        return a;
      }
    } catch {
      // best-effort: if check fails, we won't block the user
    }
    setPolicy(null);
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setCreatedUrl(null);
    setPolicy(null);

    // 1) Run Policy Pre-Check first (title = URL/caption fallback for now)
    const title = sourceUrl.trim();
    const description = caption.trim();
    const assessment = await runPolicyCheck({ title, description });
    const sev = assessment?.severity || "UNKNOWN";

    // 2) Block only on HIGH severity
    if (sev === "HIGH") {
      setBusy(false);
      setMsg("Blocked: This looks risky for most affiliate programs. Please revise and try again.");
      return;
    }

    // 3) Continue to create Smart Link
    try {
      const res = await fetch("/api/smartlinks/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: sourceUrl.trim(),
          caption: caption.trim() || null,
        }),
      });

      const j = await res.json();
      if (!res.ok || !j?.ok) {
        setMsg(j?.error || j?.message || "Failed to create Smart Link");
        return;
      }

      const url: string =
        j.shortUrl ||
        j.url ||
        (j.id ? `https://linkmint.co/link/${j.id}` : "");

      setCreatedUrl(url || null);
      setMsg("Smart Link created — ready to share!");
    } catch (err: any) {
      setMsg(err?.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("✅ Copied to clipboard");
    } catch {
      setMsg("Copy failed — long-press to copy");
    }
  }

  // UI helpers
  const sev = policy?.severity || "NONE";
  const sevBadge =
    sev === "HIGH"
      ? "bg-red-100 text-red-700 border-red-300"
      : sev === "MEDIUM"
      ? "bg-amber-100 text-amber-700 border-amber-300"
      : sev === "LOW"
      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
      : "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <div className="space-y-4">
      {/* Simple, mobile-first form */}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Paste a store link</label>
          <input
            required
            inputMode="url"
            placeholder="https://store.com/product/123"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            We’ll convert this into a payout-ready Smart Link.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Optional caption (safe wording)</label>
          <textarea
            placeholder="Short blurb to share with your link"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm min-h-[90px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={busy || !sourceUrl.trim()}
            className="rounded-2xl border px-4 py-2 text-sm disabled:opacity-60"
          >
            {busy ? "Checking…" : "Generate Smart Link"}
          </button>

          {createdUrl && (
            <button
              type="button"
              onClick={() => copy(createdUrl)}
              className="rounded-2xl border px-4 py-2 text-sm"
            >
              Copy Link
            </button>
          )}
        </div>

        {msg && (
          <div className="text-sm text-gray-700">
            {msg}{" "}
            {createdUrl && (
              <span className="break-all underline decoration-dotted ml-1">
                {createdUrl}
              </span>
            )}
          </div>
        )}
      </form>

      {/* Policy results panel (shown after pre-check) */}
      {policy && (
        <div className={`rounded-2xl border p-3 ${sevBadge}`}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Policy Pre-Check: {policy.severity}</div>
            <div className="text-xs">
              Engine: {policy.usedLLM ? "LLM + heuristics" : "Heuristics"}
            </div>
          </div>

          {policy.findings?.length ? (
            <ul className="mt-2 list-disc pl-5 text-sm">
              {policy.findings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm">No common risks detected.</p>
          )}

          {policy.severity === "HIGH" && (
            <p className="mt-2 text-sm">
              This looks risky for most affiliate programs. Try removing gift cards/cashback stacking language and avoid self-purchase wording.
            </p>
          )}
        </div>
      )}

      {/* Inline AI Suggestions (mini-list) */}
      <section className="rounded-2xl border p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">AI Suggestions (beta)</h3>
          <a
            href="/dashboard/opportunities"
            className="text-xs text-teal-700 hover:underline"
          >
            See all
          </a>
        </div>

        <div className="grid gap-3">
          {SUGGESTIONS.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium truncate">
                    {s.title} · <span className="text-gray-600">{s.merchant}</span>
                  </div>
                  {s.badge && (
                    <span className="rounded-full border px-2 py-0.5 text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">
                      {s.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                  {s.caption}
                </p>
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => useSuggestion(s)}
                  className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Use This
                </button>
                <button
                  type="button"
                  onClick={() => copy(s.url)}
                  className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                  title="Copy the base store link"
                >
                  Copy Store Link
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Tips: Avoid gift cards & coupon stacking. Purchases must happen after your Smart Link click.
        </p>
      </section>
    </div>
  );
}

