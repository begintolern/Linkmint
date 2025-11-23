// app/payouts/page.tsx

import Link from "next/link";

export const metadata = {
  title: "Payouts Explained | linkmint.co",
  description:
    "Clear explanation of how payouts work on linkmint.co: affiliate approvals, pending vs approved, honeymoon period, TrustScore, and early payout rules.",
};

export default function PayoutsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12 lg:py-16">
        {/* Breadcrumb / mini header */}
        <div className="mb-6 text-xs font-medium uppercase tracking-wide text-teal-300/80">
          linkmint.co · Payouts Explained
        </div>

        {/* Hero */}
        <header className="mb-10 space-y-4">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            How payouts work on{" "}
            <span className="text-teal-300">linkmint.co</span>
          </h1>
          <p className="max-w-2xl text-sm text-slate-300/90 sm:text-base">
            This page explains, in simple terms,{" "}
            <span className="font-semibold text-teal-200">
              why your balance shows earnings but you can’t cash out yet
            </span>
            . The short version:{" "}
            <span className="underline decoration-teal-400/60 decoration-dotted">
              linkmint.co can only pay you after the affiliate partner pays us
            </span>
            .
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-teal-400/60 bg-teal-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-teal-100 hover:bg-teal-500/20"
            >
              Go to dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-200 hover:bg-slate-800"
            >
              Back to home
            </Link>
          </div>
        </header>

        {/* 1. The payout chain */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            1. The payout chain (step by step)
          </h2>

          <ol className="space-y-3 text-sm text-slate-300">
            <li>
              <span className="font-semibold text-teal-200">Step 1 — Click:</span>{" "}
              Someone taps your smart link.
            </li>
            <li>
              <span className="font-semibold text-teal-200">
                Step 2 — Purchase:
              </span>{" "}
              They buy something from the merchant (within the allowed cookie
              window and policy rules).
            </li>
            <li>
              <span className="font-semibold text-teal-200">
                Step 3 — Tracking:
              </span>{" "}
              The merchant/affiliate network logs the sale under linkmint.co.
            </li>
            <li>
              <span className="font-semibold text-teal-200">
                Step 4 — Review period:
              </span>{" "}
              The network reviews the order (for refund risk, fraud, etc.). This
              is usually{" "}
              <span className="font-semibold">around 30–90 days</span>,
              depending on the merchant/network.
            </li>
            <li>
              <span className="font-semibold text-teal-200">
                Step 5 — Payout to linkmint.co:
              </span>{" "}
              Once the order is approved, the network pays{" "}
              <span className="font-semibold">linkmint.co</span>.
            </li>
            <li>
              <span className="font-semibold text-teal-200">
                Step 6 — Payout to you:
              </span>{" "}
              Only after linkmint.co has been paid can your commission move into
              the <span className="font-semibold">payout-eligible</span> pool.
            </li>
          </ol>

          <p className="mt-4 text-xs text-slate-400">
            Any platform that pays before Step 5 is basically lending money on
            risk. linkmint.co keeps it safer:{" "}
            <span className="font-semibold">no payout before we get paid</span>.
          </p>
        </section>

        {/* 2. Pending vs Approved vs Paid */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            2. Pending vs Approved vs Paid
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                Pending
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                We see the sale and the expected commission, but the affiliate
                network is still in the{" "}
                <span className="font-semibold">review / lock period</span>.
              </p>
            </div>

            <div className="rounded-xl border border-teal-500/50 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-teal-300">
                Approved
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                The network has{" "}
                <span className="font-semibold">confirmed</span> the order and
                will pay linkmint.co. Approved commissions are{" "}
                <span className="font-semibold text-teal-200">
                  eligible for payout
                </span>{" "}
                once funds arrive.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/50 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                Paid
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                The commission has been{" "}
                <span className="font-semibold">
                  successfully paid out to you
                </span>{" "}
                (for example via PayPal) and logged in your payout history.
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Your dashboard and Trust Center label every commission clearly with
            one of these states so you always know{" "}
            <span className="font-semibold">where your money is</span>.
          </p>
        </section>

        {/* 3. Honeymoon period & TrustScore */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            3. Honeymoon period & TrustScore
          </h2>

          <p className="mb-3 text-sm text-slate-300">
            When you first join linkmint.co, your account goes through a{" "}
            <span className="font-semibold text-teal-200">
              honeymoon period
            </span>{" "}
            (for example, the first 30 days). During this time, payouts move a
            bit slower on purpose.
          </p>

          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                We wait for{" "}
                <span className="font-semibold">real, clean activity</span>:
                normal clicks, a few legit purchases, no spammy patterns.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                Your behavior feeds into a{" "}
                <span className="font-semibold">TrustScore</span> that helps
                unlock{" "}
                <span className="font-semibold text-teal-200">
                  better tiers (up to 85%)
                </span>{" "}
                and smoother payouts.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                After the honeymoon period and a clean history,{" "}
                <span className="font-semibold">
                  payouts can be processed faster
                </span>{" "}
                once commissions are approved and paid to linkmint.co.
              </span>
            </li>
          </ul>

          <p className="mt-4 text-xs text-slate-400">
            This protects everyone: honest users, the platform, and the
            merchants you’re linking to.
          </p>
        </section>

        {/* 4. Early payouts (float) */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            4. Early payouts (float) – when they are possible
          </h2>

          <p className="mb-3 text-sm text-slate-300">
            In some cases, linkmint.co may offer{" "}
            <span className="font-semibold text-teal-200">
              early payouts
            </span>{" "}
            for trusted users. This is always done using{" "}
            <span className="font-semibold">real money already received</span>{" "}
            from faster-paying networks.
          </p>

          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                Only commissions that are{" "}
                <span className="font-semibold">
                  marked approved by the affiliate network
                </span>{" "}
                can be considered for early payout.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                You must have a{" "}
                <span className="font-semibold">strong TrustScore</span> and be
                outside your honeymoon period.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                linkmint.co must have{" "}
                <span className="font-semibold">
                  enough float balance available
                </span>
                . There’s always a hard cap to prevent risk.
              </span>
            </li>
          </ul>

          <p className="mt-4 text-xs text-slate-400">
            We do{" "}
            <span className="font-semibold">
              not offer early payouts on Amazon commissions
            </span>{" "}
            unless they are explicitly marked fully approved and paid by
            Amazon’s system.
          </p>
        </section>

        {/* 5. Minimums, fees, and methods */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            5. Minimums, fees, and payout methods
          </h2>

          <p className="mb-3 text-sm text-slate-300">
            During the early phase, payouts are kept simple and manual for
            safety, usually via{" "}
            <span className="font-semibold text-teal-200">PayPal</span>.
          </p>

          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                Each payout must meet the{" "}
                <span className="font-semibold">minimum threshold</span>{" "}
                shown in your dashboard (for example, $10 or similar).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                Standard{" "}
                <span className="font-semibold">PayPal fees are deducted</span>{" "}
                from the payout amount as part of the platform rules.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                More payout options (and auto-payouts) may open as the platform
                matures and volume grows.
              </span>
            </li>
          </ul>

          <p className="mt-4 text-xs text-slate-400">
            For your exact thresholds, currencies, and supported methods, always
            follow the live info inside your dashboard.
          </p>
        </section>

        {/* FAQ mini */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            6. Quick payout FAQ
          </h2>

          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <p className="font-semibold text-slate-100">
                “I see earnings. Why can’t I withdraw?”
              </p>
              <p className="text-sm text-slate-300">
                Because they&apos;re still{" "}
                <span className="font-semibold">pending</span>. We’re waiting
                for the affiliate network to approve the order and pay
                linkmint.co. Once approved and paid, they move to payout
                eligible.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-100">
                “Will my money disappear if a purchase is refunded?”
              </p>
              <p className="text-sm text-slate-300">
                If the network cancels the commission (refund, fraud, or rule
                violation), that specific earning is removed. We only pay out{" "}
                <span className="font-semibold">confirmed, paid commissions</span>.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-100">
                “How do I speed up my payouts?”
              </p>
              <p className="text-sm text-slate-300">
                You can&apos;t shorten merchant review windows, but you{" "}
                <span className="font-semibold">
                  can improve your TrustScore
                </span>{" "}
                with clean traffic, real purchases, and no spam. That helps
                once commissions are approved.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA / links */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 text-sm text-slate-300">
          <p className="max-w-md text-xs text-slate-400">
            If you still feel stuck or confused by a specific payout, check the{" "}
            <Link
              href="/trust-center"
              className="font-semibold text-teal-300 underline decoration-teal-500/60 decoration-dotted underline-offset-2 hover:text-teal-200"
            >
              Trust Center
            </Link>{" "}
            and your{" "}
            <Link
              href="/dashboard/earnings"
              className="font-semibold text-teal-300 underline decoration-teal-500/60 decoration-dotted underline-offset-2 hover:text-teal-200"
            >
              earnings page
            </Link>{" "}
            for exact labels and timestamps.
          </p>
          <Link
            href="/referrals"
            className="inline-flex items-center rounded-full border border-teal-400/60 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-teal-100 hover:bg-teal-500/20"
          >
            See referral rules
          </Link>
        </div>
      </div>
    </main>
  );
}
