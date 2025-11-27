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
};

const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: "sandals-ph",
    title: "Women’s everyday sandals under ₱1,500",
    merchantName: "Charles & Keith / Zalora PH",
    category: "Fashion · Footwear",
    regionHint: "Strong PH demand, especially during hot weather and payday.",
    explanation:
      "Everyday sandals in neutral colors perform well with PH buyers, especially when shown with outfits or positioned as work + casual friendly.",
    exampleAngle:
      "“Soft, comfy sandals you can wear to work, the mall, or date night — everyday Filipino-friendly pairs.”",
  },
  {
    id: "havaianas-ph",
    title: "Havaianas everyday flip-flops for PH weather",
    merchantName: "Havaianas PH",
    category: "Fashion · Footwear",
    regionHint:
      "The pair most Filipinos actually use daily — durable, reliable, and good for errands.",
    explanation:
      "Havaianas are PH staples. Highlight durability and comfort for errands, daily walking, commuting, and general everyday use.",
    exampleAngle:
      "“The one pair of slippers you actually use every day — durable, comfy, and perfect for PH weather.”",
  },
  {
    id: "peripherals",
    title: "Budget gaming mice & keyboards",
    merchantName: "Razer / Lazada PH / Shopee PH",
    category: "Tech · Gaming",
    regionHint:
      "Popular among students and casual gamers, especially during promos.",
    explanation:
      "Budget peripherals get strong click-through when paired with before/after setups or simple TikTok desk clips.",
    exampleAngle:
      "“If you’re still using an office mouse for Valorant, here are 3 budget gaming mice that feel like a massive upgrade.”",
  },
  {
    id: "selfcare",
    title: "Affordable self-care bundles",
    merchantName: "Watsons / Lazada PH / Shopee PH",
    category: "Beauty · Self-care",
    regionHint: "Very strong around payday and gifting seasons.",
    explanation:
      "Self-care bundles convert well when framed as affordable treats or gifts, especially with free shipping.",
    exampleAngle:
      "“Payday self-care for under ₱1,000 — bundles that feel like a spa day without wrecking your budget.”",
  },
  {
    id: "home",
    title: "Small home upgrades under ₱800",
    merchantName: "Shopee PH / Lazada PH",
    category: "Home · Lifestyle",
    regionHint:
      "Great for renters, students, and condo setups looking for small improvements.",
    explanation:
      "Space-saving organizers, small lighting upgrades, and kitchen helpers perform well in PH households.",
    exampleAngle:
      "“Tiny apartment hacks: 5 things under ₱800 that make your space feel less crowded and more ‘Pinterest.’”",
  },
  {
    id: "tiktok-desk",
    title: "Aesthetic desk setups for TikTok",
    merchantName: "Shopee PH / Lazada PH",
    category: "Home · TikTok-ready",
    regionHint:
      "Great for creators posting desk setup or productivity-style TikTok clips.",
    explanation:
      "Mini upgrades (RGB lights, stands, organizers) are highly visual and perfect for quick TikTok demos.",
    exampleAngle:
      "“POV: You add 3 cheap items to your desk and suddenly it looks like a Pinterest setup.”",
  },
  {
    id: "tiktok-gadgets",
    title: "Viral mini gadgets and ‘add to cart’ finds",
    merchantName: "Shopee PH / Lazada PH",
    category: "Gadgets · TikTok-ready",
    regionHint: "High impulse-buy potential when shown in short clips.",
    explanation:
      "Mini fans, cable organizers, holders, and tiny convenience gadgets do well on TikTok-style content.",
    exampleAngle:
      "“Things TikTok made me buy — small gadgets I actually use every day.”",
  },
];

const PAYDAY_PRESET_IDS = ["sandals-ph", "peripherals", "selfcare", "home"] as const;
const TIKTOK_PRESET_IDS = ["tiktok-desk", "tiktok-gadgets", "peripherals"] as const;
const HIGH_EARNING_IDS = ["selfcare", "sandals-ph", "peripherals"] as const;

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
    } catch {}
  }, []);

  function saveRecentQueries(next: string[]) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("linkmint_discover_recent", JSON.stringify(next));
    } catch {}
  }

  function pushRecentQuery(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRecentQueries((prev) => {
      const existing = prev.filter((v) => v.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...existing].slice(0, 3);
      saveRecentQueries(next);
      return next;
    });
  }

  function getPreset(ids: readonly string[]) {
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

    if (normalized.includes("payday") || normalized.includes("sweldo")) {
      setTimeout(() => {
        setResults(getPreset(PAYDAY_PRESET_IDS));
        setIsThinking(false);
      }, 400);
      return;
    }

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

    const finalResults = filtered.length > 0 ? filtered : [...MOCKS_WITH_FALLBACK_SHUFFLE()];

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

  const filteredResults = results.filter((s) => {
    if (activeCategory === "all") return true;
    const cat = s.category.toLowerCase();
    if (activeCategory === "fashion") return cat.includes("fashion") || cat.includes("footwear");
    if (activeCategory === "tech") return cat.includes("tech") || cat.includes("gaming");
    if (activeCategory === "selfcare") return cat.includes("self") || cat.includes("beauty");
    if (activeCategory === "home") return cat.includes("home");
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 lg:py-12">
        
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-teal-500/50 bg-teal-500/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-100">
                AI-assisted discovery
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">
              {isEN
                ? "Discover ideas to promote (AI-assisted)"
                : "Maghanap ng ideas na pwede mong i-promote (AI-assisted)"}
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              {isEN
                ? "Describe the kind of buyer, price range, or product you have in mind — AI suggests categories, merchants, and angles that tend to work. You still choose the final product."
                : "I-describe mo lang ang buyer type, budget, o produkto — mag-susuggest ang AI ng categories, merchants, at angles. Ikaw pa rin ang may final say."}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 p-0.5 text-[11px]">
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
              Back to overview
            </Link>
          </div>
        </div>

        {/* HIGH-EARNING PICKS */}
        <section className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
          <div className="mb-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-500/20 px-3 py-1">
              <span>💰</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-100">
                High-earning picks (AI-assisted)
              </span>
            </div>
            <p className="mt-2 text-[11px] text-amber-100/80">
              These categories often pay better commissions and convert well for PH buyers.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highEarningSuggestions.map((s) => (
              <article
                key={s.id}
                className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-3"
              >
                <p className="text-[11px] font-semibold text-teal-100 uppercase tracking-wide mb-1">
                  {s.category}
                </p>
                <h3 className="text-sm font-semibold text-slate-50">{s.title}</h3>
                <p className="mt-1 text-[11px] text-slate-400">{s.merchantName}</p>
                <p className="mt-2 text-[11px] text-slate-300 italic">{s.exampleAngle}</p>
              </article>
            ))}
          </div>

          <p className="mt-3 text-[10px] text-amber-100/70">
            AI-assisted categories only — real commissions depend on the merchant.
          </p>
        </section>

        {/* SEARCH INPUT */}
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
                Ask the AI assistant
              </label>
              <input
                id="discover-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Example: sandals under ₱1,500, budget gaming gear, desk setup ideas"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!query.trim() || isThinking}
              className="inline-flex items-center justify-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400 disabled:bg-slate-700"
            >
              {isThinking ? "Thinking…" : "Ask AI"}
            </button>
          </form>

          {/* QUICK PROMPTS */}
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => handleQuickPrompt("PH payday hot picks")}
              className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-amber-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-amber-100 hover:bg-amber-500/20"
            >
              <span>🔥</span>
              <span>PH Payday Hot Picks</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPrompt("TikTok-ready ideas")}
              className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400 bg-fuchsia-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-fuchsia-100 hover:bg-fuchsia-500/20"
            >
              <span>🎵</span>
              <span>TikTok-ready ideas</span>
            </button>
          </div>

          {/* RECENT SEARCHES */}
          {recentQueries.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-[11px] text-slate-500">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentQueries.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => handleRecentClick(text)}
                    className="truncate rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-200 hover:border-teal-500"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RESULTS */}
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                Suggested ideas
              </h2>
              {hasSearched && (
                <span className="text-[11px] text-slate-500">
                  {isThinking
                    ? "Thinking…"
                    : `Showing ${filteredResults.length} ideas`}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <CategoryChip
                label="All"
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              />
              <CategoryChip
                label="Fashion"
                active={activeCategory === "fashion"}
                onClick={() => setActiveCategory("fashion")}
              />
              <CategoryChip
                label="Tech & Gaming"
                active={activeCategory === "tech"}
                onClick={() => setActiveCategory("tech")}
              />
              <CategoryChip
                label="Self-care / Beauty"
                active={activeCategory === "selfcare"}
                onClick={() => setActiveCategory("selfcare")}
              />
              <CategoryChip
                label="Home & Lifestyle"
                active={activeCategory === "home"}
                onClick={() => setActiveCategory("home")}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredResults.map((s) => {
              const showAngles = openAnglesId === s.id;
              const angles = showAngles ? generateAngles(s, isEN) : [];

              return (
                <article
                  key={s.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-50">{s.title}</h3>
                    <p className="mt-1 text-xs text-teal-200">{s.merchantName}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {s.category}
                      {s.regionHint ? ` · ${s.regionHint}` : ""}
                    </p>
                    <p className="mt-3 text-xs text-slate-300">{s.explanation}</p>

                    <p className="mt-3 text-[11px] italic text-slate-400">
                      Suggested angle:{" "}
                      <span className="not-italic text-slate-300">
                        {s.exampleAngle}
                      </span>
                    </p>

                    {showAngles && angles.length > 0 && (
                      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                        <p className="mb-1 text-[11px] font-semibold text-slate-200">
                          Sample angles you can use:
                        </p>
                        <ul className="space-y-1">
                          {angles.map((angle, idx) => (
                            <li
                              key={idx}
                              className="text-[11px] text-slate-300 leading-snug"
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
                      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-200 hover:border-teal-500"
                    >
                      💡{" "}
                      {showAngles ? "Hide angles" : "Generate angles"}
                    </button>

                    <Link
                      href="/dashboard/links"
                      className="inline-flex items-center rounded-full bg-teal-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-teal-400"
                    >
                      Create smart link
                    </Link>

                    <Link
                      href="/tutorial"
                      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-200 hover:border-teal-500"
                    >
                      See how to promote
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
      className={`rounded-full px-3 py-1 border text-[11px] ${
        active
          ? "border-teal-500 bg-teal-500/20 text-teal-100"
          : "border-slate-700 bg-slate-950 text-slate-200 hover:border-teal-500"
      }`}
    >
      {label}
    </button>
  );
}

function generateAngles(s: Suggestion, isEN: boolean): string[] {
  const lower = s.category.toLowerCase();

  if (isEN) {
    if (lower.includes("tiktok")) {
      return [
        "Quick 10–15 second clip showing a before/after with a simple caption.",
        "Show your real desk/room setup with one small upgrade to make it relatable.",
        "Use POV shots and clean transitions — TikTok loves simplicity.",
      ];
    }
    if (lower.includes("fashion")) {
      return [
        "Show ‘1 item = 3 outfits’ to emphasize value.",
        "Position it as a payday treat that’s still practical.",
        "Highlight comfort and daily usability instead of hype.",
      ];
    }
    if (lower.includes("self") || lower.includes("beauty")) {
      return [
        "Frame it as a mini-routine upgrade under a reachable budget.",
        "Bundle products and explain how each step works.",
        "Make it giftable — birthdays, holidays, payday treats.",
      ];
    }
    if (lower.includes("home")) {
      return [
        "Show small-space before/after transformations.",
        "Emphasize renter-friendly upgrades.",
        "Position it as a ‘small change, big impact’ item.",
      ];
    }
    if (lower.includes("tech") || lower.includes("gaming")) {
      return [
        "Compare the item to a basic/old setup.",
        "Explain improvements without going into technical jargon.",
        "Highlight value for students (budget-friendly upgrade).",
      ];
    }
  }

  // TL version
  return [
    "Gumawa ng simple before/after clip para relatable.",
    "Ipakita kung paano ginagamit sa totoong araw-araw.",
    "I-focus ang value at practicality — hindi lang aesthetics.",
  ];
}

function MOCKS_WITH_FALLBACK_SHUFFLE(): Suggestion[] {
  const arr = [...MOCK_SUGGESTIONS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor((i + 3) * 37) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
