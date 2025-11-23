// app/trust-center/page.tsx

import Link from "next/link";

export const metadata = {
  title: "Trust Center | linkmint.co",
  description:
    "Learn how linkmint.co protects users, merchants, and the platform with TrustScore, payout rules, and anti-fraud safeguards.",
};

export default function TrustCenterPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12 lg:py-16">
        {/* Breadcrumb */}
        <div className="mb-6 text-xs font-medium uppercase tracking-wide text-teal-300/80">
          linkmint.co · Trust Center
        </div>

        {/* Hero */}
        <header className="mb-10 space-y-4">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            Trust Center for{" "}
            <span className="text-teal-300">linkmint.co</span>
          </h1>
          <p className="max-w-2xl text-sm text-slate-300/90 sm:text-base">
            This page explains{" "}
            <span className="font-semibold text-teal-200">
              how we keep payouts honest, protect merchants, and treat users
              fairly
            </span>
            . If you ever wonder, &quot;Is my money safe here?&quot; or
            &quot;Why is my payout delayed?&quot; — this is the answer.
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

        {/* 1. Core payout rule */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            1. The non-negotiable payout rule
          </h2>
          <p className="mb-3 text-sm text-slate-300">
            linkmint.co has one rule that never changes:
          </p>
          <p className="rounded-xl border border-teal-500/40 bg-slate-950/70 p-3 text-sm text-slate-100">
            <span className="font-semibold text-teal-200">
              We only pay users after the affiliate partner has paid
              linkmint.co.
            </span>{" "}
            Pending earnings are not cash yet. Only{" "}
            <span className="font-semibold">cleared, paid commissions</span>{" "}
            are.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            This protects honest users, the platform, and merchants. It also
            keeps linkmint.co from collapsing due to fake traffic or refunded
            orders.
          </p>
        </section>

        {/* 2. TrustScore & behavior */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            2. TrustScore: how we measure account health
          </h2>
          <p className="mb-3 text-sm text-slate-300">
            Every account has an internal{" "}
            <span className="font-semibold text-teal-200">TrustScore</span>.
            You don&apos;t have to be perfect — we just want to see{" "}
            <span className="font-semibold">normal, human behavior</span>.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-teal-500/40 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-teal-300">
                Things that help your TrustScore
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                <li>• Real people clicking your links</li>
                <li>• Normal traffic patterns (not botted)</li>
                <li>• Legit purchases that don&apos;t get refunded</li>
                <li>• Following each merchant&apos;s policy rules</li>
              </ul>
            </div>

            <div className="rounded-xl border border-rose-500/40 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-200">
                Things that hurt your TrustScore
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                <li>• Fake clicks or incentivized bots</li>
                <li>• Self-purchases that break merchant rules</li>
                <li>• High refund or chargeback patterns</li>
                <li>• Spamming links where they&apos;re not allowed</li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Your TrustScore can unlock{" "}
            <span className="font-semibold">
              higher commission tiers (up to 85%)
            </span>{" "}
            and smoother payouts — or slow your account down if we detect risk.
          </p>
        </section>

        {/* 3. Honeymoon period */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            3. Honeymoon period for new accounts
          </h2>
          <p className="mb-3 text-sm text-slate-300">
            When you&apos;re new to linkmint.co, your account goes through a{" "}
            <span className="font-semibold text-teal-200">
              honeymoon period
            </span>{" "}
            (for example, around the first 30 days). During this time, payouts
            are intentionally more conservative.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                We focus on{" "}
                <span className="font-semibold">learning your traffic</span>:
                where clicks come from, how people buy, and if refunds are
                normal or suspicious.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                Once your honeymoon period passes and your history looks clean,
                payouts can process{" "}
                <span className="font-semibold">more smoothly</span> (still
                always after the affiliate partner pays us).
              </span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            We&apos;d rather be slightly slower at the start than put the whole
            community at risk with aggressive, unsafe payouts.
          </p>
        </section>

        {/* 4. Early payouts & float */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            4. Early payouts (float) and strict limits
          </h2>
          <p className="mb-3 text-sm text-slate-300">
            In some cases, linkmint.co may offer{" "}
            <span className="font-semibold text-teal-200">
              early payouts
            </span>{" "}
            for trusted users using{" "}
            <span className="font-semibold">
              funds that have already been received
            </span>{" "}
            from affiliate partners.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                Only{" "}
                <span className="font-semibold">approved commissions</span>{" "}
                from the network can be considered for early payout.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                You must have{" "}
                <span className="font-semibold">good TrustScore</span> and be
                outside your honeymoon period.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                There is always a{" "}
                <span className="font-semibold">hard cap on float</span> so the
                platform never over-extends itself.
              </span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            We do not use debt or risky loans for payouts. Early payout is a{" "}
            <span className="font-semibold">privilege</span>, not a right, and
            it&apos;s always based on real, received money.
          </p>
        </section>

        {/* 5. User, platform, merchant balance */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            5. Balancing users, platform, and merchants
          </h2>
          <p className="mb-3 text-sm text-slate-300">
            linkmint.co is built to be{" "}
            <span className="font-semibold">sustainable</span>, not a hype
            scheme. That means:
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                Users get{" "}
                <span className="font-semibold text-teal-200">
                  70–85% of commissions
                </span>{" "}
                — a very high share.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                Referrers can get a{" "}
                <span className="font-semibold text-amber-200">
                  5% override
                </span>{" "}
                for inviting active earners during a bonus window.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                The platform keeps a{" "}
                <span className="font-semibold">minimum 15% margin</span> to pay
                for infrastructure, support, taxes, and future growth.
              </span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            That balance is what lets linkmint.co exist long-term instead of
            burning out after a few months.
          </p>
        </section>

        {/* Links to other explainer pages */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            6. Related pages
          </h2>
          <p className="mb-3 text-sm text-slate-300">
            If you want more detail on specific parts of the system, these pages
            go deeper:
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-full border border-teal-400/60 bg-teal-500/10 px-4 py-1.5 font-semibold uppercase tracking-wide text-teal-100 hover:bg-teal-500/20"
            >
              How it works
            </Link>
            <Link
              href="/payouts"
              className="inline-flex items-center rounded-full border border-slate-600 bg-slate-900/80 px-4 py-1.5 font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800"
            >
              Payouts explained
            </Link>
            <Link
              href="/referrals"
              className="inline-flex items-center rounded-full border border-slate-600 bg-slate-900/80 px-4 py-1.5 font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800"
            >
              Referral rules
            </Link>
            <Link
              href="/tutorial"
              className="inline-flex items-center rounded-full border border-slate-600 bg-slate-900/80 px-4 py-1.5 font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800"
            >
              Full tutorial
            </Link>
          </div>
        </section>

        {/* Footer note */}
        <div className="border-t border-slate-800 pt-4 text-xs text-slate-500">
          If you still have questions about your account or payouts, check your{" "}
          <span className="font-semibold">dashboard notices</span> or contact
          support using the email shown on the site.
        </div>
      </div>
    </main>
  );
}
