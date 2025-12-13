// app/dashboard/discover/DiscoverClient.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Suggestion = {
  id: string;
  title: string;
  merchantName: string;
  category: string;
  regionHint?: string;
  explanation: string;
  exampleAngle: string;
  ofwSafe?: boolean;
};

const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: "sandals-ph",
    title: "Women’s everyday sandals under ₱1,500",
    merchantName: "Havaianas PH",
    category: "Fashion · Footwear",
    regionHint: "Strong PH demand, especially summer and payday weekends.",
    explanation:
      "Simple, everyday sandals with neutral colors tend to convert well for PH buyers, especially when framed as work + casual use and shown with real-life outfits.",
    exampleAngle:
      "“Soft, comfy sandals you can wear to work, the mall, or date night — no high heels, just everyday Filipino-friendly pairs.”",
    ofwSafe: true,
  },
  {
    id: "peripherals",
    title: "Budget gaming mice & keyboards",
    merchantName: "Razer / Lazada / Shopee PH (if approved)",
    category: "Tech · Gaming",
    regionHint:
      "Popular with students and weekend gamers, especially around payday sales.",
    explanation:
      "Peripherals under a reachable price point tend to get a lot of clicks, especially when TikTok or Facebook content shows simple before/after setups.",
    exampleAngle:
      "“If you’re still using an office mouse for Valorant, here are 3 budget gaming mice that are a massive upgrade without going full ‘pro’ pricing.”",
    ofwSafe: true,
  },
  {
    id: "selfcare",
    title: "Affordable self-care bundles",
    merchantName: "Watsons / Lazada / Shopee bundles",
    category: "Beauty · Self-care",
    regionHint: "Payday treat and gift behavior is strong in PH for bundles.",
    explanation:
      "Pre-bundled self-care packs (skin care, bath, hair) do well as payday treats and gifts, especially if you highlight free shipping or bundle savings.",
    exampleAngle:
      "“Payday self-care for under ₱1,000 — 3 bundles that feel like a spa day without wrecking your budget.”",
    ofwSafe: true,
  },
  {
    id: "home",
    title: "Small home upgrades under ₱800",
    merchantName: "Shopee / Lazada PH (if approved)",
    category: "Home · Lifestyle",
    regionHint:
      "High impulse-buy potential for renters and small spaces during payday promos.",
    explanation:
      "Things like organizers, lights, shelves, and kitchen helpers do well when you show simple before/after changes and emphasize space-saving.",
    exampleAngle:
      "“Tiny apartment hacks: 5 things under ₱800 that make your space feel less crowded and more ‘Pinterest’.”",
    ofwSafe: true,
  },
  {
    id: "tiktok-desk",
    title: "Aesthetic desk setups for TikTok",
    merchantName: "Shopee / Lazada PH (if approved)",
    category: "Home · TikTok-ready",
    regionHint:
      "Great for TikTok ‘desk setup’ videos and productivity content, especially with RGB or pastel themes.",
    explanation:
      "Small, visual upgrades like RGB lights, cute organizers, and monitor stands work very well in TikTok clips because they show satisfying before/after changes.",
    exampleAngle:
      "“POV: you upgrade your study desk with 3 cheap items and suddenly it looks like a Pinterest setup.”",
    ofwSafe: true,
  },
  {
    id: "tiktok-gadgets",
    title: "Viral mini gadgets and ‘add to cart’ finds",
    merchantName: "Shopee / Lazada PH (if approved)",
    category: "Gadgets · TikTok-ready",
    regionHint:
      "Strong impulse-buy potential when shown in short clips with quick demos.",
    explanation:
      "Mini fans, cable organizers, phone stands, and small ‘TikTok hacks’ items work well when you show them in 5–10 second clips with simple text overlays.",
    exampleAngle:
      "“Things I got from Shopee that TikTok made me buy (and I don’t regret it).”",
    ofwSafe: true,
  },
];

const PAYDAY_PRESET_IDS = [
  "sandals-ph",
  "peripherals",
  "selfcare",
  "home",
] as const;

const TIKTOK_PRESET_IDS = [
  "tiktok-desk",
  "tiktok-gadgets",
  "peripherals",
] as const;

// Curated list of categories that typically carry stronger commission potential
const HIGH_EARNING_IDS = [
  "selfcare",
  "sandals-ph",
  "peripherals",
] as const;

type CategoryFilter = "all" | "fashion" | "tech" | "selfcare" | "home";
type Language = "en" | "tl";

export default function DiscoverClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>(MOCK_SUGGESTIONS);
  const [hasSearched, setHasSearched] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [language, setLanguage] = useState<Language>("en");
  const [openAnglesId, setOpenAnglesId] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  const isEN = language === "en";
  const highEarningSuggestions = getPreset(HIGH_EARNING_IDS);

  // Load recent queries from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("linkmint_discover_recent");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter((v) => typeof v === "string")
          .map((v) => v.trim())
          .filter(Boolean)
          .slice(0, 3);
        setRecentQueries(cleaned);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  function saveRecentQueries(next: string[]) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "linkmint_discover_recent",
        JSON.stringify(next),
      );
    } catch {
      // ignore
    }
  }

  function pushRecentQuery(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRecentQueries((prev) => {
      const existing = prev.filter(
        (v) => v.toLowerCase() !== trimmed.toLowerCase(),
      );
      const next = [trimmed, ...existing].slice(0, 3);
      saveRecentQueries(next);
      return next;
    });
  }

  function getPreset(ids: readonly string[]): Suggestion[] {
    return MOCK_SUGGESTIONS.filter((s) => ids.includes(s.id));
  }

  function handleQuickPrompt(text: string) {
    setQuery(text);
    runMockAI(text);
  }

  function handleRecentClick(text: string) {
    setQuery(text);
    runMockAI(text);
  }

  function runMockAI(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;

    setIsThinking(true);
    setHasSearched(true);
    pushRecentQuery(trimmed);

    const normalized = trimmed.toLowerCase();

    // Payday preset
    if (normalized.includes("payday") || normalized.includes("sweldo")) {
      setTimeout(() => {
        setResults(getPreset(PAYDAY_PRESET_IDS));
        setIsThinking(false);
      }, 400);
      return;
    }

    // TikTok preset
    if (normalized.includes("tiktok")) {
      setTimeout(() => {
        setResults(getPreset(TIKTOK_PRESET_IDS));
        setIsThinking(false);
      }, 400);
      return;
    }

    const filtered = MOCK_SUGGESTIONS.filter((s) => {
      return (
        s.title.toLowerCase().includes(normalized) ||
        s.category.toLowerCase().includes(normalized) ||
        s.merchantName.toLowerCase().includes(normalized)
      );
    });

    const finalResults =
      filtered.length > 0 ? filtered : [...MOCKS_WITH_FALLBACK_SHUFFLE()];

    setTimeout(() => {
      setResults(finalResults);
      setIsThinking(false);
    }, 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    runMockAI(query.trim());
  }

  // Apply category filter on top of AI results
  const filteredResults = results.filter((s) => {
    if (activeCategory === "all") return true;
    const cat = s.category.toLowerCase();
    if (activeCategory === "fashion") return cat.includes("fashion");
    if (activeCategory === "tech")
      return cat.includes("tech") || cat.includes("gaming");
    if (activeCategory === "selfcare")
      return cat.includes("self-care") || cat.includes("beauty");
    if (activeCategory === "home") return cat.includes("home");
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 lg:py-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-teal-500/50 bg-teal-500/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-100">
                {isEN ? "AI-assisted discovery" : "AI-assisted na discovery"}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">
              {isEN
                ? "Discover ideas to promote (AI-assisted)"
                : "Maghanap ng ideas na pwede mong i-promote (AI-assisted)"}
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              {isEN
                ? "Describe the kind of buyer, price range, or product you have in mind. Our AI-assisted helper suggests categories, merchants, and angles that tend to work well — you still choose the final product."
                : "I-describe mo lang kung anong klaseng buyer, budget, o produkto ang target mo. Tutulong ang AI-assisted helper mag-suggest ng categories, merchants, at anggulo na kadalasang nagwo-work — ikaw pa rin ang pipili ng final product."}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Language toggle */}
            <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-full ${
                  isEN ? "bg-teal-500 text-slate-950" : "text-slate-300"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("tl")}
                className={`px-3 py-1 rounded-full ${
                  !isEN ? "bg-teal-500 text-slate-950" : "text-slate-300"
                }`}
              >
                TL
              </button>
            </div>

            <Link
              href="/dashboard"
              className="hidden rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 sm:inline-flex"
            >
              {isEN ? "Back to overview" : "Balik sa overview"}
            </Link>
          </div>
        </div>

        {/* HIGH-EARNING PICKS (AI-assisted) */}
        <section className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-500/20 px-3 py-1">
                <span>💰</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-100">
                  {isEN
                    ? "High-earning picks (AI-assisted)"
                    : "High-earning picks (AI-assisted)"}
                </span>
              </div>
              <p className="mt-2 text-xs text-amber-100/80">
                {isEN
                  ? "Categories like self-care, everyday fashion, and budget tech often pay better commissions and convert well for PH buyers. These suggestions are AI-assisted — you still choose the exact product and merchant."
                  : "Categories tulad ng self-care, everyday fashion, at budget tech ay madalas may mas ok na commission at conversion para sa PH buyers. AI-assisted lang ang suggestions na ‘to — ikaw pa rin ang pipili ng exact product at merchant."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highEarningSuggestions.map((s) => (
              <article
                key={s.id}
                className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-3"
              >
                <p className="text-xs font-semibold text-teal-100 uppercase tracking-wide mb-1">
                  {s.category}
                </p>
                {s.ofwSafe && (
                  <p className="mb-1 text-[10px] font-medium text-emerald-300">
                    {isEN
                      ? "OFW-safe: OFW can pay abroad as long as the link is a PH offer and delivery address is in the Philippines (subject to merchant rules)."
                      : "OFW-safe: puwedeng magbayad si OFW sa abroad basta PH link at sa Pilipinas ang delivery address (depende sa rules ng merchant)."}
                  </p>
                )}
                <h3 className="text-sm font-semibold text-slate-50">
                  {s.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {s.merchantName}
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  {isEN ? "Idea hint:" : "Idea hint:"}{" "}
                  <span className="italic text-slate-200">
                    {s.exampleAngle}
                  </span>
                </p>
              </article>
            ))}
          </div>

          <p className="mt-3 text-[10px] text-amber-100/70">
            {isEN ? (
              <>
                Note: These are{" "}
                <span className="font-semibold text-amber-50">
                  AI-assisted high-earning categories
                </span>
                , not guaranteed top payouts. Actual commissions still depend on
                each merchant&apos;s rates and approved transactions.
              </>
            ) : (
              <>
                Paalala:{" "}
                <span className="font-semibold text-amber-50">
                  AI-assisted high-earning categories
                </span>{" "}
                lang ito, hindi garantiya ng pinakamataas na payout. Naka-depende
                pa rin ang actual commissions sa rates at approved transactions
                ng bawat merchant.
              </>
            )}
          </p>
        </section>

        {/* Input panel */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <label
                htmlFor="discover-query"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300"
              >
                {isEN
                  ? "Ask the AI assistant for ideas"
                  : "Sabihin sa AI assistant kung anong idea ang hanap mo"}
              </label>
              <input
                id="discover-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isEN
                    ? "Example: trending PH sandals under ₱1,500, or budget gaming gear for students"
                    : "Halimbawa: trending na sandals sa PH under ₱1,500, o budget gaming setup para sa students"
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isThinking}
              className="inline-flex items-center justify-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 sm:self-end"
            >
              {isThinking
                ? isEN
                  ? "Thinking…"
                  : "Nag-iisip…"
                : isEN
                ? "Ask AI"
                : "Tanungin si AI"}
            </button>
          </form>

          {/* Quick prompts */}
          <div className="mt-4 space-y-3">
            {/* Big payday pill */}
            <button
              type="button"
              onClick={() =>
                handleQuickPrompt(
                  "ph payday hot picks for Filipino buyers during sweldo",
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-100 hover:bg-amber-500/20"
            >
              <span>🔥</span>
              <span>
                {isEN ? "PH Payday Hot Picks" : "PH Payday Hot Picks (sweldo)"}
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-sm font-medium">
                {isEN ? "AI-assisted" : "AI-assisted"}
              </span>
            </button>

            {/* Big TikTok pill */}
            <button
              type="button"
              onClick={() =>
                handleQuickPrompt(
                  "tiktok-ready ideas for Filipino creators and short-form content",
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400 bg-fuchsia-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-100 hover:bg-fuchsia-500/20"
            >
              <span>🎵</span>
              <span>
                {isEN
                  ? "TikTok-Ready Ideas"
                  : "TikTok-ready na product ideas"}
              </span>
              <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-sm font-medium">
                {isEN ? "AI-assisted" : "AI-assisted"}
              </span>
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt("trending everyday fashion items for PH")
                }
                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:border-teal-500 hover:text-teal-100"
              >
                {isEN
                  ? "Payday-friendly PH fashion"
                  : "Payday-friendly na PH fashion"}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt("budget tech items students can afford")
                }
                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:border-teal-500 hover:text-teal-100"
              >
                {isEN ? "Student tech / gaming" : "Student tech / gaming"}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt("small home upgrades for renters")
                }
                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:border-teal-500 hover:text-teal-100"
              >
                {isEN ? "Small home upgrades" : "Maliit na home upgrades"}
              </button>
            </div>
          </div>

          {/* Recent searches */}
          {recentQueries.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-xs text-slate-500">
                {isEN
                  ? "Recent searches (tap to reuse):"
                  : "Mga huling hinanap (tap para ulitin):"}
              </p>
              <div className="flex flex-wrap gap-2">
                {recentQueries.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => handleRecentClick(text)}
                    className="max-w-full truncate rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:border-teal-500 hover:text-teal-100"
                    title={text}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-500">
            {isEN ? (
              <>
                Note: Suggestions are{" "}
                <span className="font-semibold text-slate-300">
                  AI-assisted, not guarantees
                </span>
                . Always respect each merchant&apos;s rules and choose products
                that genuinely make sense for your audience.
              </>
            ) : (
              <>
                Paalala: Ang suggestions dito ay{" "}
                <span className="font-semibold text-slate-300">
                  AI-assisted lang, hindi garantiya
                </span>
                . Laging sundin ang rules ng bawat merchant at pumili ng
                products na talagang bagay sa audience mo.
              </>
            )}
          </p>
        </section>

        {/* Results */}
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                {isEN ? "Suggested ideas" : "Mga suggested na idea"}
              </h2>
              {hasSearched && (
                <span className="text-xs text-slate-500">
                  {isThinking
                    ? isEN
                      ? "Refining suggestions…"
                      : "Inaayos ang suggestions…"
                    : isEN
                    ? `Showing ${filteredResults.length} idea${
                        filteredResults.length === 1 ? "" : "s"
                      } (AI-assisted)`
                    : `May ${filteredResults.length} idea${
                        filteredResults.length === 1 ? "" : "s"
                      } na naka-base sa AI (AI-assisted)`}
                </span>
              )}
            </div>

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <CategoryChip
                label={isEN ? "All" : "Lahat"}
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              />
              <CategoryChip
                label={isEN ? "Fashion" : "Fashion"}
                active={activeCategory === "fashion"}
                onClick={() => setActiveCategory("fashion")}
              />
              <CategoryChip
                label={isEN ? "Tech & Gaming" : "Tech & Gaming"}
                active={activeCategory === "tech"}
                onClick={() => setActiveCategory("tech")}
              />
              <CategoryChip
                label={isEN ? "Self-care / Beauty" : "Self-care / Beauty"}
                active={activeCategory === "selfcare"}
                onClick={() => setActiveCategory("selfcare")}
              />
              <CategoryChip
                label={isEN ? "Home & Lifestyle" : "Home & Lifestyle"}
                active={activeCategory === "home"}
                onClick={() => setActiveCategory("home")}
              />
            </div>
          </div>

          {filteredResults.length === 0 && !isThinking && (
            <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
              {isEN ? (
                <>
                  No ideas for this combination yet. Try switching the category
                  filter back to{" "}
                  <span className="font-semibold text-teal-200">All</span> or
                  asking the AI assistant for a broader idea (for example, just
                  a buyer type + budget).
                </>
              ) : (
                <>
                  Wala pang idea para sa kombinasyon na &apos;to. Subukan i-set
                  ulit sa{" "}
                  <span className="font-semibold text-teal-200">Lahat</span> ang
                  category filter o magtanong ulit kay AI ng mas general na
                  idea, tulad ng buyer type + budget lang.
                </>
              )}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredResults.map((s) => {
              const note = getMerchantNote(s, isEN);
              const showAngles = openAnglesId === s.id;
              const angles = showAngles ? generateAngles(s, isEN) : [];

              return (
                <article
                  key={s.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-50">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-xs text-teal-200">
                      {s.merchantName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {s.category}
                      {s.regionHint ? ` · ${s.regionHint}` : null}
                    </p>
                    {s.ofwSafe && (
                      <p className="mt-1 text-[10px] font-medium text-emerald-300">
                        {isEN
                          ? "OFW-safe: as long as the link is a PH offer and delivery address is in the Philippines, OFW can pay from abroad (subject to merchant rules)."
                          : "OFW-safe: basta PH offer ang link at sa Pilipinas ang delivery address, puwedeng magbayad si OFW mula abroad (depende sa rules ng merchant)."}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-slate-300">
                      {s.explanation}
                    </p>
                    <p className="mt-3 text-xs italic text-slate-400">
                      {isEN ? "Suggested angle:" : "Suggested na anggulo:"}{" "}
                      <span className="not-italic text-slate-300">
                        {s.exampleAngle}
                      </span>
                    </p>
                    {note && (
                      <p className="mt-2 flex items-start gap-1 text-[10px] text-slate-500">
                        <span className="mt-[2px]">ℹ</span>
                        <span>{note}</span>
                      </p>
                    )}

                    {showAngles && angles.length > 0 && (
                      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                        <p className="mb-1 text-xs font-semibold text-slate-200">
                          {isEN
                            ? "Sample angles you can use:"
                            : "Sample angles na pwede mong gamitin:"}
                        </p>
                        <ul className="space-y-1">
                          {angles.map((angle, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-slate-300 leading-snug"
                            >
                              • {angle}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenAnglesId(openAnglesId === s.id ? null : s.id)
                      }
                      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:border-teal-500 hover:text-teal-100"
                    >
                      <span>💡</span>
                      <span className="ml-1">
                        {showAngles
                          ? isEN
                            ? "Hide angles"
                            : "Itago ang angles"
                          : isEN
                          ? "Generate angles"
                          : "Gumawa ng angles"}
                      </span>
                    </button>

                    <Link
                      href="/dashboard/links"
                      className="inline-flex items-center rounded-full bg-teal-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-teal-400"
                    >
                      {isEN
                        ? "Create smart link with this idea"
                        : "Gumawa ng smart link gamit ang idea na ito"}
                    </Link>
                    <Link
                      href="/tutorial"
                      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:border-teal-500 hover:text-slate-50"
                    >
                      {isEN
                        ? "See how to promote it"
                        : "Tingnan kung paano i-promote"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 border text-xs ${
        active
          ? "border-teal-500 bg-teal-500/20 text-teal-100"
          : "border-slate-700 bg-slate-950 text-slate-200 hover:border-teal-500 hover:text-teal-100"
      }`}
    >
      {label}
    </button>
  );
}

// Merchant reminder text
function getMerchantNote(s: Suggestion, isEN: boolean): string | null {
  const lowerCategory = s.category.toLowerCase();
  const lowerRegion = (s.regionHint || "").toLowerCase();
  const isTikTok =
    lowerCategory.includes("tiktok") ||
    s.id.startsWith("tiktok-") ||
    s.title.toLowerCase().includes("tiktok");

  if (isTikTok) {
    return isEN
      ? "Some merchants have strict rules for TikTok and short-form video traffic. Always check their allowed platforms before posting."
      : "May ilang merchants na mahigpit sa TikTok at short-form video traffic. Laging i-check ang allowed platforms bago ka mag-post.";
  }

  if (lowerRegion.includes("ph") || lowerRegion.includes("payday")) {
    return isEN
      ? "PH traffic and payday promos usually perform best here. Make sure your content matches the merchant’s region and promo rules."
      : "Mas madalas mag-work ang PH traffic at payday promos para sa ganitong category. Siguraduhin na tugma ang content mo sa region at promo rules ng merchant.";
  }

  return isEN
    ? "Always review each merchant’s rules (allowed platforms, regions, and content) to protect your commissions."
    : "Laging basahin ang rules ng bawat merchant (allowed platforms, regions, at content) para siguradong hindi masasayang ang commissions mo.";
}

// Angle generator (medium-strength, EN/TL, tuned per category)
function generateAngles(s: Suggestion, isEN: boolean): string[] {
  const lowerCategory = s.category.toLowerCase();
  const title = s.title;
  const isTikTok =
    lowerCategory.includes("tiktok") ||
    s.id.startsWith("tiktok-") ||
    title.toLowerCase().includes("tiktok");
  const isFashion =
    lowerCategory.includes("fashion") || lowerCategory.includes("footwear");
  const isHome = lowerCategory.includes("home");
  const isSelfCare =
    lowerCategory.includes("self-care") || lowerCategory.includes("beauty");
  const isTech =
    lowerCategory.includes("tech") || lowerCategory.includes("gaming");

  if (isEN) {
    if (isTikTok) {
      return [
        "Quick 10–15 second clips showing a simple before/after shot and a short caption like “small upgrade, big difference.”",
        "“Things I actually use from my TikTok cart” style list, featuring this item as one of the top picks.",
        "Desk or room POV shot while you unbox or set up the item, with a calm caption about making your space feel better, not just “aesthetic.”",
      ];
    }
    if (isFashion) {
      return [
        "Highlight how the item fits into everyday life: office, mall, dates, and casual weekends — not just “OOTD” posts.",
        "Create a simple “1 item, 3 outfits” idea to show how flexible the purchase is for someone on a budget.",
        "Position it as a payday treat that is still practical: something they can use many times, not a one-time flex.",
      ];
    }
    if (isSelfCare) {
      return [
        "Frame it as a small self-care ritual after a long day — perfect for payday but still within a realistic budget.",
        "Bundle 2–3 items together in your content and explain how each one fits into a simple night routine.",
        "Position it as a giftable set for friends or family, not just self-use, to increase reasons to buy.",
      ];
    }
    if (isHome) {
      return [
        "Show a quick before/after of a small space, focusing on how the item helps keep things less messy and more calm.",
        "Mention renters and condo/boarding house setups so people feel like it’s tailored to their living situation.",
        "Emphasize “small change, big daily impact” — how this one thing saves time, space, or stress.",
      ];
    }
    if (isTech) {
      return [
        "Explain in simple language how this upgrade feels compared to a basic setup (e.g., office mouse vs gaming mouse).",
        "Position it as a realistic student upgrade — something they can save for and actually justify.",
        "Use a short “before and after” angle: how playing, studying, or working feels smoother with this gear.",
      ];
    }
    // fallback generic
    return [
      "Explain who this is really for (type of person, budget, and situation) so it feels specific, not generic.",
      "Show one simple before/after scenario where this product solves a tiny daily annoyance.",
      "Position it as a realistic, repeat-use purchase rather than a one-off impulse buy.",
    ];
  } else {
    // Taglish / TL
    if (isTikTok) {
      return [
        "Gumawa ng 10–15 second clip na simple lang ang before/after, tapos caption na like “maliit na upgrade, pero ang laki ng difference.”",
        "“Mga bagay na binili ko dahil sa TikTok (na hindi ko pinagsisihan)” style video, kasama itong item sa top picks mo.",
        "POV-style na kuha ng desk o kwarto habang ina-unbox o sina-setup mo, caption tungkol sa “small changes para mas gumanda yung araw mo.”",
      ];
    }
    if (isFashion) {
      return [
        "Ipakita kung paano magagamit sa araw-araw: office, mall, lakad, at casual weekend — hindi lang pang-OOTD.",
        "Gawa ka ng “1 item, 3 outfits” para ma-feel ng viewers na sulit siya sa dami ng pwedeng paggamitan.",
        "I-frame siya as payday treat na practical pa rin — hindi lang luho, kundi bagay na madalas gagamitin.",
      ];
    }
    if (isSelfCare) {
      return [
        "Ikuwento siya bilang maliit na self-care routine pagkatapos ng mahabang araw — swak sa payday pero hindi mabigat sa bulsa.",
        "I-bundle mo 2–3 items sa content at ipaliwanag paano sila kasya sa simple na night routine.",
        "I-position bilang pwedeng i-regalo sa kaibigan o family, hindi lang para sa sarili, para mas maraming reason bumili.",
      ];
    }
    if (isHome) {
      return [
        "Magpakita ng before/after ng maliit na space, tapos i-highlight paano nakatulong yung item para bawas kalat at bawas stress.",
        "Banggitin ang mga nagre-rent, naka-bedspace, o condo para mas relatable sa setup nila.",
        "I-emphasize na “maliit na gamit, malaking epekto sa araw-araw” — nakakatipid sa oras, space, o inis.",
      ];
    }
    if (isTech) {
      return [
        "Ikuwento in simple terms kung gaano ka-iba ang feel kumpara sa basic setup (halimbawa office mouse vs gaming mouse).",
        "I-frame bilang realistic na upgrade para sa students — bagay na pwede nilang pag-ipunan na may sense.",
        "Gawa ng before/after angle: paano mas smooth ang laro, aral, o trabaho pag gamit na yung gear na ‘to.",
      ];
    }
    return [
      "Linawin kung para kanino talaga ‘yung product (anong klaseng tao, budget, at sitwisan) para hindi generic ang dating.",
      "Magbigay ng isang totoong scenario sa araw-araw kung saan nakakatulong siya, para makita ng viewers yung value.",
      "I-position bilang bilihing may gamit araw-araw, hindi lang impulsive na “add to cart” moment.",
    ];
  }
}

// Simple helper to “shuffle” in case no match is found
function MOCKS_WITH_FALLBACK_SHUFFLE(): Suggestion[] {
  const arr = [...MOCK_SUGGESTIONS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor((i + 3) * 37) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
