"use client";

/**
 * Animated, read-only tutorial that explains:
 * 1) AI Suggestions
 * 2) Explore Merchants (rules visible)
 * 3) Create Smart Link (all fields)
 * 4) Policy Pre-Check (severity + fixes)
 * 5) Share & Track (why a purchase may disqualify)
 * 6) Payouts & TrustScore (funds must be received first)
 *
 * Notes:
 * - Pure front-end demo. No API/DB calls.
 * - Accessible: keyboard navigation, ARIA labels, captions.
 * - Safe: does not import or alter any dashboard/core code.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  LayoutGrid,
  Link as LinkIcon,
  ShieldCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Lock,
  AlertTriangle,
  Clock,
  Ban,
  Globe2,
  BadgePercent,
  Receipt,
  CheckCircle2,
} from "lucide-react";

type StepId =
  | "welcome"
  | "ai"
  | "merchants"
  | "create"
  | "policy"
  | "track"
  | "payouts";

const STEPS: { id: StepId; title: string; icon: JSX.Element }[] = [
  { id: "welcome", title: "Welcome", icon: <Sparkles className="h-4 w-4" /> },
  { id: "ai", title: "AI Suggestions", icon: <Wand2 className="h-4 w-4" /> },
  { id: "merchants", title: "Explore Merchants", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "create", title: "Create Smart Link", icon: <LinkIcon className="h-4 w-4" /> },
  { id: "policy", title: "Policy Pre-Check", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "track", title: "Share & Track", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "payouts", title: "Payouts & TrustScore", icon: <Lock className="h-4 w-4" /> },
];

export default function TutorialPage() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Autoplay advance
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % STEPS.length);
    }, 5200);
    return () => clearInterval(t);
  }, [playing]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
      if (e.key.toLowerCase() === " ") setPlaying((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const step = STEPS[idx];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500" />
            <span>linkmint.co</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/trust-center" className="hover:underline">
              Trust Center
            </Link>
            <Link href="/signup" className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold hover:bg-emerald-700">
              Try it now
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[1fr_320px]">
        {/* Left: Tutorial stage */}
        <section aria-labelledby="stage-title" className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            {/* Step tabs */}
            <ol className="flex flex-wrap gap-2">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIdx(i)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${
                    idx === i
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                  aria-current={idx === i}
                >
                  {s.icon}
                  {s.title}
                </button>
              ))}
            </ol>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous step"
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                className="rounded-md border border-slate-700 p-1 hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label={playing ? "Pause autoplay" : "Play autoplay"}
                onClick={() => setPlaying((p) => !p)}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
              >
                {playing ? "Pause" : "Play"}
              </button>
              <button
                aria-label="Next step"
                onClick={() => setIdx((i) => Math.min(STEPS.length - 1, i + 1))}
                className="rounded-md border border-slate-700 p-1 hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <h1 id="stage-title" className="mb-4 text-xl font-semibold md:text-2xl">
            {step.title}
          </h1>

          {/* Animated panel */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg"
              >
                {step.id === "welcome" && <WelcomePanel />}
                {step.id === "ai" && <AIPanel />}
                {step.id === "merchants" && <MerchantsPanel />}
                {step.id === "create" && <CreatePanel />}
                {step.id === "policy" && <PolicyPanel />}
                {step.id === "track" && <TrackPanel />}
                {step.id === "payouts" && <PayoutsPanel />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom CTA */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              I understand the rules — Sign me up
            </Link>
            <span className="text-xs text-slate-400">
              Unregistered users can’t access the dashboard. Create an account to start earning.
            </span>
          </div>
        </section>

        {/* Right: Rule Board (persistent emphasis) */}
        <aside className="sticky top-16 h-fit rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Core Rules (Always On)
          </h2>
          <ul className="space-y-2 text-sm text-slate-200">
            <li className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 text-emerald-400" />
              <span>We pay <b>only after</b> the affiliate partner pays linkmint.co.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-400" />
              <span><b>No self-purchase</b>, spam clicks, or bot traffic. Violations hurt TrustScore.</span>
            </li>
            <li className="flex items-start gap-2">
              <BadgePercent className="mt-0.5 h-4 w-4 text-blue-300" />
              <span><b>No coupon stacking</b> unless explicitly allowed by the merchant.</span>
            </li>
            <li className="flex items-start gap-2">
              <Receipt className="mt-0.5 h-4 w-4 text-sky-300" />
              <span>Gift cards are usually <b>excluded</b> from commissions.</span>
            </li>
            <li className="flex items-start gap-2">
              <Globe2 className="mt-0.5 h-4 w-4 text-violet-300" />
              <span>Respect <b>geo restrictions</b>, allowed platforms, and cookie windows.</span>
            </li>
          </ul>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
            <p className="mb-1 font-semibold">Disqualification examples:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Self-purchase or same-payment-account as sharer</li>
              <li>Outside cookie window (e.g., purchase on day 48 of a 30-day window)</li>
              <li>Refunded/cancelled orders → reversed</li>
              <li>Disallowed platform (e.g., merchant forbids Reddit)</li>
              <li>Unauthorized coupon applied</li>
            </ul>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Transparency first: Link statuses (Pending, Approved, Paid, Reversed) show exactly
            what happened and why.
          </p>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} linkmint.co</span>
          <div className="flex items-center gap-4">
            <Link href="/trust-center" className="hover:underline">
              Trust Center
            </Link>
            <Link href="/signup" className="hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* -------- Panels (mock UI only) -------- */

function WelcomePanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold">Create, share, earn — with compliance built in.</h3>
        <p className="mt-2 text-sm text-slate-300">
          This 90-second tour shows how you go from <b>idea → smart link → share → commission</b>.
          You’ll also see how we surface <b>merchant rules</b>, prevent violations, and explain
          <b> why some purchases don’t qualify</b>.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-slate-300">
          <li>• AI Suggestions turn topics into draft copy & merchant ideas</li>
          <li>• Explore Merchants reveals allowed platforms & cookie windows</li>
          <li>• Policy Pre-Check flags risks before you post</li>
          <li>• Payouts only after funds are received — no exceptions</li>
        </ul>
      </div>
      <MockPhone>
        <div className="grid gap-2 p-3">
          <div className="h-4 w-1/2 rounded bg-slate-800" />
          <div className="h-3 w-2/3 rounded bg-slate-800" />
          <div className="h-24 rounded bg-slate-800/80" />
        </div>
      </MockPhone>
    </div>
  );
}

function AIPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold">AI Suggestions</h3>
        <p className="mt-2 text-sm text-slate-300">
          Type a product, merchant, or theme (e.g., <i>“beginner camera under $500”</i>). Our AI
          returns <b>offer ideas</b>, <b>network hints</b>, platform-fit titles and captions, plus
          short <b>CTAs</b>. Click <i>Use Draft</i> to prefill your Smart Link form.
        </p>
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
          <p className="mb-1 font-semibold">Rule reminder:</p>
          <p>AI helps you ideate, but <b>merchant policies still govern</b>. Always check rules.</p>
        </div>
      </div>
      <MockPhone>
        <div className="space-y-2 p-3">
          <div className="rounded border border-slate-800 p-2">
            <label className="mb-1 block text-[10px] uppercase text-slate-400">Topic</label>
            <div className="h-7 rounded bg-slate-800" />
          </div>
          <div className="rounded border border-slate-800 p-2">
            <label className="mb-1 block text-[10px] uppercase text-slate-400">Results</label>
            <div className="h-20 rounded bg-slate-800/80" />
            <div className="mt-2 h-6 w-24 rounded bg-emerald-700/70" />
          </div>
        </div>
      </MockPhone>
    </div>
  );
}

function MerchantsPanel() {
  const rules = useMemo(
    () => [
      { icon: <Ban className="h-3.5 w-3.5" />, text: "No self-purchase" },
      { icon: <BadgePercent className="h-3.5 w-3.5" />, text: "No coupon stacking" },
      { icon: <Receipt className="h-3.5 w-3.5" />, text: "Gift cards excluded" },
      { icon: <Globe2 className="h-3.5 w-3.5" />, text: "Geo restrictions apply" },
      { icon: <Clock className="h-3.5 w-3.5" />, text: "30-day cookie window" },
    ],
    []
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold">Explore Merchants</h3>
        <p className="mt-2 text-sm text-slate-300">
          Browse compatible merchants and networks. Each card shows <b>allowed platforms</b>,{" "}
          <b>cookie window</b>, and <b>policy flags</b> from our Merchant Rules database so you stay
          compliant.
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-200">
          {rules.map((r, i) => (
            <li key={i} className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900 p-2">
              {r.icon}
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <MockPhone>
        <div className="grid gap-2 p-3">
          <div className="flex gap-2">
            <div className="h-7 w-20 rounded bg-slate-800" />
            <div className="h-7 w-20 rounded bg-slate-800" />
            <div className="h-7 w-20 rounded bg-slate-800" />
          </div>
          <div className="rounded border border-slate-800 p-2">
            <div className="mb-2 h-4 w-2/3 rounded bg-slate-800" />
            <div className="mb-2 h-3 w-1/2 rounded bg-slate-800/80" />
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded bg-emerald-700/70" />
              <div className="h-6 w-16 rounded bg-slate-700/70" />
            </div>
          </div>
        </div>
      </MockPhone>
    </div>
  );
}

function CreatePanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold">Create Smart Link</h3>
        <p className="mt-2 text-sm text-slate-300">
          Fill the form: <b>Destination URL</b>, <b>Title</b>, <b>Short caption</b>, target{" "}
          <b>Platform</b>, <b>Network</b>, optional <b>UTM/source</b>, and <b>Audience tags</b>.
          We’ll normalize your link and attach tracking. Disclosure helper suggests a compliant
          blurb per platform.
        </p>
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
          <p className="mb-1 font-semibold">Rule reminder:</p>
          <p>Affiliate disclosure is required on all posts. You must follow each merchant’s policy.</p>
        </div>
      </div>
      <MockPhone>
        <div className="grid gap-2 p-3">
          <Field label="Destination URL" />
          <Field label="Title" />
          <Field label="Short Caption" />
          <div className="flex gap-2">
            <Pill>Platform</Pill>
            <Pill>Network</Pill>
            <Pill>Tags</Pill>
          </div>
          <div className="mt-2 h-7 w-28 rounded bg-emerald-700/70" />
        </div>
      </MockPhone>
    </div>
  );
}

function PolicyPanel() {
  const findings = [
    { sev: "MEDIUM", text: "Coupon stacking often disallowed — remove ‘stack with any code’." },
    { sev: "LOW", text: "Avoid implying guaranteed savings if terms vary by region." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold">Policy Pre-Check</h3>
        <p className="mt-2 text-sm text-slate-300">
          Paste your caption and run a check. We flag common risks like <b>gift cards</b>,{" "}
          <b>coupon stacking</b>, <b>self-purchase</b>, or <b>prohibited claims</b>. Use suggested
          fixes before sharing to avoid reversals.
        </p>
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
          <p className="mb-1 font-semibold">Severity scale:</p>
          <p>None → Low → Medium → High. Ignoring High may lead to rejected commissions.</p>
        </div>
      </div>
      <MockPhone>
        <div className="space-y-2 p-3">
          <div className="rounded border border-slate-800 p-2">
            <label className="mb-1 block text-[10px] uppercase text-slate-400">Caption</label>
            <div className="h-14 rounded bg-slate-800/80" />
          </div>
          <div className="rounded border border-slate-800 p-2">
            <label className="mb-1 block text-[10px] uppercase text-slate-400">Findings</label>
            <ul className="space-y-1 text-xs">
              {findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <SeverityBadge level={f.sev as "LOW" | "MEDIUM" | "HIGH"} />
                  <span className="text-slate-300">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MockPhone>
    </div>
  );
}

function TrackPanel() {
  const reasons = [
    { icon: <Ban className="h-3.5 w-3.5" />, text: "Self-purchase (same account/payment)" },
    { icon: <Clock className="h-3.5 w-3.5" />, text: "Outside cookie window" },
    { icon: <Receipt className="h-3.5 w-3.5" />, text: "Refunded/Cancelled order" },
    { icon: <Globe2 className="h-3.5 w-3.5" />, text: "Disallowed region/platform" },
    { icon: <BadgePercent className="h-3.5 w-3.5" />, text: "Unauthorized coupon" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold">Share & Track</h3>
        <p className="mt-2 text-sm text-slate-300">
          After you share, we track clicks and attribute purchases. Commissions start as{" "}
          <b>Pending</b> and move to <b>Approved</b> only after the affiliate network clears funds.
          Some purchases may be <b>Disqualified</b> — and we show the reason clearly.
        </p>
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
          <p className="mb-1 font-semibold">Why a purchase may not qualify:</p>
          <ul className="mt-1 grid grid-cols-1 gap-1">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                {r.icon}
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <MockPhone>
        <div className="space-y-2 p-3">
          <div className="rounded border border-slate-800 p-2">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-slate-300">Clicks (24h)</span>
              <span className="rounded bg-slate-800 px-2 py-0.5">132</span>
            </div>
            <div className="h-16 rounded bg-slate-800/80" />
          </div>
          <div className="rounded border border-slate-800 p-2 text-xs">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-slate-300">Last purchase</span>
              <span className="rounded bg-yellow-700/40 px-2 py-0.5">Disqualified</span>
            </div>
            <p className="text-slate-400">Reason: Unauthorized coupon applied</p>
          </div>
        </div>
      </MockPhone>
    </div>
  );
}

function PayoutsPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold">Payouts & TrustScore</h3>
        <p className="mt-2 text-sm text-slate-300">
          Balances show <b>Pending</b>, <b>Approved</b>, and <b>Paid</b>. Withdrawals are available
          only after <b>funds are received from the affiliate partner</b>. TrustScore improves with
          clean traffic and valid conversions — but even high TrustScore cannot bypass payout rules.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          <li>• No early payouts</li>
          <li>• Fees (e.g., PayPal) are deducted</li>
          <li>• Returns/reversals reduce balances</li>
        </ul>
      </div>
      <MockPhone>
        <div className="space-y-2 p-3">
          <div className="rounded border border-slate-800 p-2 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <BalanceCard label="Pending" amount="$18.42" />
              <BalanceCard label="Approved" amount="$6.10" />
              <BalanceCard label="Paid" amount="$12.32" />
            </div>
          </div>
          <div className="rounded border border-slate-800 p-2 text-xs">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-slate-300">Withdraw</span>
              <Lock className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <p className="text-slate-400">Locked until funds are received and rules are met.</p>
          </div>
          <div className="rounded border border-slate-800 p-2 text-xs">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-slate-300">TrustScore</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="h-2 w-full rounded bg-slate-800">
              <div className="h-2 w-2/3 rounded bg-emerald-500" />
            </div>
          </div>
        </div>
      </MockPhone>
    </div>
  );
}

/* -------- Small presentational helpers -------- */

function MockPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[380px] md:max-w-[420px]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 shadow-xl">
        {children}
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">Phone-size preview (9:16)</p>
    </div>
  );
}

function Field({ label }: { label: string }) {
  return (
    <div className="rounded border border-slate-800 p-2">
      <label className="mb-1 block text-[10px] uppercase text-slate-400">{label}</label>
      <div className="h-7 rounded bg-slate-800" />
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{children}</div>;
}

function BalanceCard({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900 p-2">
      <div className="text-[10px] uppercase text-slate-400">{label}</div>
      <div className="text-sm text-slate-200">{amount}</div>
    </div>
  );
}

function SeverityBadge({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) {
  const cls =
    level === "HIGH"
      ? "bg-red-900/50 border-red-700 text-red-200"
      : level === "MEDIUM"
      ? "bg-yellow-900/40 border-yellow-700 text-yellow-100"
      : "bg-sky-900/40 border-sky-700 text-sky-100";
  return <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] ${cls}`}>{level}</span>;
}
