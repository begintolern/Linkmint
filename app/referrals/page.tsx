// app/referrals/page.tsx

import Link from "next/link";

export const metadata = {
  title: "Referral Program | linkmint.co",
  description:
    "Understand how the linkmint.co referral system works, how you earn 70–85% plus a 5% referral override, and when payouts become available.",
};

export default function ReferralPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12 lg:py-16">
        {/* Breadcrumb / mini header */}
        <div className="mb-6 text-xs font-medium uppercase tracking-wide text-teal-300/80">
          linkmint.co · Referral Program Guide
        </div>

        {/* Hero */}
        <header className="mb-10 space-y-4">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            Referral earnings on{" "}
            <span className="text-teal-300">linkmint.co</span>
          </h1>
          <p className="max-w-2xl text-sm text-slate-300/90 sm:text-base">
            This page explains, in plain language, how our referral system
            works: your{" "}
            <span className="font-semibold text-teal-200">
              70–85% share
            </span>{" "}
            as the person sharing the link, the{" "}
            <span className="font-semibold text-teal-200">
              5% referral override
            </span>{" "}
            for the person who invited you, and how{" "}
            <span className="underline decoration-teal-400/60 decoration-dotted">
              payouts only happen after we get paid by the affiliate partner
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

        {/* 1. Core idea */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            1. The core idea
          </h2>
          <p className="mb-3 text-sm text-slate-300">
            linkmint.co turns normal product links into{" "}
            <span className="font-semibold text-teal-200">
              smart links
            </span>
            . When someone clicks your smart link and makes a legit purchase
            approved by the affiliate partner, there is a commission.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                You, the person sharing the link, always get{" "}
                <span className="font-semibold text-teal-200">the biggest</span>{" "}
                piece of that commission:{" "}
                <span className="font-semibold text-teal-200">
                  70–85% of what linkmint.co receives
                </span>
                .
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                If someone invited you to linkmint.co with a referral link, they
                can earn a{" "}
                <span className="font-semibold text-teal-200">
                  5% override
                </span>{" "}
                on your approved commissions during a limited{" "}
                <span className="font-semibold">bonus window</span>.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                The remaining percentage stays with{" "}
                <span className="font-semibold text-slate-100">
                  linkmint.co
                </span>{" "}
                to cover platform costs, float for early payouts, risk, and
                profit.
              </span>
            </li>
          </ul>
        </section>

        {/* 2. Split breakdown */}
        <section className="mb-10 space-y-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-50">
            2. How the commission split works
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-teal-500/40 bg-slate-900/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-teal-300">
                You · Link Sharer
              </h3>
              <p className="mt-1 text-2xl font-bold text-teal-200">
                70–85%
              </p>
              <p className="mt-2 text-xs text-slate-300">
                Your share grows with{" "}
                <span className="font-semibold">TrustScore</span> and good
                behavior on the platform.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/40 bg-slate-900/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                Inviter · Referral Override
              </h3>
              <p className="mt-1 text-2xl font-bold text-amber-100">5%</p>
              <p className="mt-2 text-xs text-slate-300">
                Only if you were invited and only{" "}
                <span className="font-semibold">
                  during the active bonus window
                </span>
                .
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                Platform · linkmint.co
              </h3>
              <p className="mt-1 text-2xl font-bold text-slate-100">≥15%</p>
              <p className="mt-2 text-xs text-slate-300">
                Minimum platform margin. Used for tech costs, float, support,
                and keeping the business alive.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Note: Exact percentages can change slightly between{" "}
            <span className="font-medium text-slate-200">
              different merchants and tiers
            </span>
            , but we always keep your share high and the platform margin at
            least 15%.
          </p>
        </section>

        {/* 3. Example scenarios */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            3. Simple example scenarios
          </h2>
          <p className="mb-4 text-sm text-slate-300">
            Assume linkmint.co receives a{" "}
            <span className="font-semibold text-teal-200">
              $10 commission
            </span>{" "}
            from a merchant after your link leads to an approved purchase.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                A. No inviter (you joined directly)
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                <li>• You at 75% tier → you earn $7.50</li>
                <li>• No inviter override</li>
                <li>• linkmint.co keeps $2.50</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                B. You were invited (override active)
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                <li>• You at 75% tier → you earn $7.50</li>
                <li>• Your inviter gets 5% → $0.50</li>
                <li>• linkmint.co keeps $2.00</li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            These numbers are just examples to show the logic. Actual earnings
            depend on merchant commission rates, your TrustScore, and which
            referral bonuses are active.
          </p>
        </section>

        {/* 4. Timing & payouts */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            4. When do payouts actually happen?
          </h2>

          <div className="space-y-3 text-sm text-slate-300">
            <p>
              Your dashboard may show{" "}
              <span className="font-semibold text-teal-200">
                pending earnings
              </span>{" "}
              quickly after a purchase, but{" "}
              <span className="font-semibold">
                we can only pay you once the affiliate partner pays linkmint.co
              </span>
              .
            </p>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
                <span>
                  Most networks have a{" "}
                  <span className="font-semibold">
                    review + lock period
                  </span>{" "}
                  (often 30 days or more) to confirm the purchase is legit and
                  not refunded.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
                <span>
                  Only{" "}
                  <span className="font-semibold">
                    approved and paid-out commissions
                  </span>{" "}
                  move into your payout-eligible balance.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
                <span>
                  Early payouts (float) are only possible for{" "}
                  <span className="font-semibold">
                    trusted users with cleared funds and available platform
                    float
                  </span>
                  . We never pay out money that the platform hasn’t actually
                  received.
                </span>
              </li>
            </ul>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            For details on payout methods, minimums, and TrustScore rules, see
            the{" "}
            <Link
              href="/trust-center"
              className="font-medium text-teal-300 underline decoration-teal-500/60 decoration-dotted underline-offset-2 hover:text-teal-200"
            >
              Trust Center
            </Link>{" "}
            inside your dashboard.
          </p>
        </section>

        {/* 5. How to earn referral override as an inviter */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            5. How you earn the 5% override as an inviter
          </h2>

          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
            <li>
              Share your{" "}
              <span className="font-semibold text-teal-200">
                personal referral link
              </span>{" "}
              from your dashboard.
            </li>
            <li>
              When someone signs up through that link and becomes an{" "}
              <span className="font-semibold">active user</span>, they are
              linked to you as their inviter.
            </li>
            <li>
              For a limited period (for example,{" "}
              <span className="font-semibold">
                90 days from their first approved commission
              </span>
              ), you can earn{" "}
              <span className="font-semibold text-amber-200">
                5% override
              </span>{" "}
              on their approved commissions.
            </li>
            <li>
              This override does{" "}
              <span className="font-semibold">not reduce</span> their share
              below their tier target. It comes out of linkmint.co&apos;s
              margin.
            </li>
          </ol>

          <p className="mt-4 text-xs text-slate-400">
            Exact referral windows and rules are shown in your dashboard
            referral cards. If there&apos;s any difference between this page and
            the in-app text,{" "}
            <span className="font-semibold">the dashboard rules win</span>.
          </p>
        </section>

        {/* FAQ mini */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            6. Quick FAQ
          </h2>

          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <p className="font-semibold text-slate-100">
                Do I always earn at least 70%?
              </p>
              <p className="text-sm text-slate-300">
                Yes. As long as the commission is legit and approved, your base
                share starts at{" "}
                <span className="font-semibold text-teal-200">70%</span> and can
                climb toward{" "}
                <span className="font-semibold text-teal-200">85%</span> as your
                TrustScore improves.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-100">
                Does the 5% override take money away from me?
              </p>
              <p className="text-sm text-slate-300">
                No. The override comes from{" "}
                <span className="font-semibold">linkmint.co&apos;s share</span>,
                not your cut. Your tier is your tier.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-100">
                Why is my payout taking so long?
              </p>
              <p className="text-sm text-slate-300">
                Because we have to wait for the{" "}
                <span className="font-semibold">
                  affiliate network to confirm and pay out
                </span>
                . Your dashboard will always label each commission as{" "}
                &quot;pending,&quot; &quot;approved,&quot; or &quot;paid&quot; so
                you know what&apos;s happening.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 text-sm text-slate-300">
          <p className="max-w-md text-xs text-slate-400">
            Tip: Start by inviting{" "}
            <span className="font-semibold text-teal-200">3 people</span> you
            trust. Focus on real purchases, not spam. That&apos;s how you build
            a strong TrustScore and unlock higher tiers.
          </p>
          <Link
            href="/dashboard/referrals"
            className="inline-flex items-center rounded-full border border-teal-400/60 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-teal-100 hover:bg-teal-500/20"
          >
            Open referral tools
          </Link>
        </div>
      </div>
    </main>
  );
}
