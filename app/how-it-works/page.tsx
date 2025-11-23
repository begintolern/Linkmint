// app/how-it-works/page.tsx

import Link from "next/link";

export const metadata = {
  title: "How It Works | linkmint.co",
  description:
    "Quick overview of how linkmint.co works: create smart links, share, earn 70–85% commissions, and understand the payout flow.",
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12 lg:py-16">
        {/* Breadcrumb */}
        <div className="mb-6 text-xs font-medium uppercase tracking-wide text-teal-300/80">
          linkmint.co · How It Works
        </div>

        {/* Hero */}
        <header className="mb-10 space-y-4">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            How <span className="text-teal-300">linkmint.co</span> works
          </h1>
          <p className="max-w-2xl text-sm text-slate-300/90 sm:text-base">
            In simple terms:{" "}
            <span className="font-semibold text-teal-200">
              you share smart links, real people buy things they actually want,
            </span>{" "}
            and once the affiliate partner pays linkmint.co,{" "}
            <span className="font-semibold text-teal-200">
              you receive 70–85% of the commission
            </span>{" "}
            (with an optional 5% override for the person who invited you).
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-teal-400/60 bg-teal-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-teal-100 hover:bg-teal-500/20"
            >
              Open dashboard
            </Link>
            <Link
              href="/tutorial"
              className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-200 hover:bg-slate-800"
            >
              View full tutorial
            </Link>
          </div>
        </header>

        {/* 1. High-level flow */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            1. The whole flow in 7 steps
          </h2>
          <ol className="space-y-3 text-sm text-slate-300">
            <li>
              <span className="font-semibold text-teal-200">Step 1:</span> Sign
              up and log in to your{" "}
              <span className="font-semibold">linkmint.co dashboard</span>.
            </li>
            <li>
              <span className="font-semibold text-teal-200">Step 2:</span>{" "}
              Choose a{" "}
              <span className="font-semibold">
                merchant or product you want to share
              </span>{" "}
              (from supported affiliate partners).
            </li>
            <li>
              <span className="font-semibold text-teal-200">Step 3:</span>{" "}
              Create a{" "}
              <span className="font-semibold text-teal-200">smart link</span>{" "}
              inside linkmint.co with the original product URL.
            </li>
            <li>
              <span className="font-semibold text-teal-200">Step 4:</span> Share
              your smart link with friends, family, followers, or in your
              normal chats and posts (following each merchant’s rules).
            </li>
            <li>
              <span className="font-semibold text-teal-200">Step 5:</span>{" "}
              Someone clicks your link and{" "}
              <span className="font-semibold">makes a legit purchase</span>.
            </li>
            <li>
              <span className="font-semibold text-teal-200">Step 6:</span> The
              affiliate network tracks the sale and, after a review period,
              <span className="font-semibold">
                {" "}
                pays linkmint.co the commission
              </span>
              .
            </li>
            <li>
              <span className="font-semibold text-teal-200">Step 7:</span>{" "}
              linkmint.co splits that commission:
              <span className="font-semibold text-teal-200">
                {" "}
                70–85% to you
              </span>
              , optional{" "}
              <span className="font-semibold text-amber-200">
                5% override to your inviter
              </span>{" "}
              (if active), and a minimum of{" "}
              <span className="font-semibold">15% for the platform</span>. Once
              your approved balance passes the minimum threshold, you can
              request a payout.
            </li>
          </ol>
        </section>

        {/* 2. Simple diagram-style breakdown */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-50">
            2. Who does what?
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-teal-500/50 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-teal-300">
                You · Link Sharer
              </h3>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                <li>• Pick products you believe in</li>
                <li>• Generate smart links</li>
                <li>• Share in normal conversations</li>
                <li>• Earn 70–85% once paid</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                linkmint.co · Platform
              </h3>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                <li>• Connects to affiliate networks</li>
                <li>• Tracks clicks and commissions</li>
                <li>• Manages TrustScore and rules</li>
                <li>• Pays out your share</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                Merchants & Networks
              </h3>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                <li>• Sell the actual products</li>
                <li>• Approve or reject orders</li>
                <li>• Pay commission to linkmint.co</li>
                <li>• Set rules and cookie windows</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Earnings & referrals summary */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            3. How you earn (commissions + referrals)
          </h2>

          <p className="mb-3 text-sm text-slate-300">
            There are two main ways you can earn on linkmint.co:
          </p>

          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <span className="font-semibold text-teal-200">
                A. Direct commissions:
              </span>{" "}
              when people buy through your smart links, you get{" "}
              <span className="font-semibold">70–85% of the commission</span>{" "}
              that linkmint.co receives from the affiliate partner (after the
              order is approved and paid out).
            </li>
            <li>
              <span className="font-semibold text-amber-200">
                B. Referral override:
              </span>{" "}
              if you invite people to linkmint.co and they start earning, you
              can get a{" "}
              <span className="font-semibold text-amber-200">
                5% override
              </span>{" "}
              on their approved commissions during a limited bonus window,
              without lowering their share.
            </li>
          </ul>

          <p className="mt-4 text-xs text-slate-400">
            For deeper details, see the{" "}
            <Link
              href="/referrals"
              className="font-semibold text-teal-300 underline decoration-teal-500/60 decoration-dotted underline-offset-2 hover:text-teal-200"
            >
              Referral Program page
            </Link>{" "}
            and the{" "}
            <Link
              href="/payouts"
              className="font-semibold text-teal-300 underline decoration-teal-500/60 decoration-dotted underline-offset-2 hover:text-teal-200"
            >
              Payouts Explained page
            </Link>
            .
          </p>
        </section>

        {/* 4. Payout timing short version */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            4. When do you actually get paid?
          </h2>

          <p className="mb-3 text-sm text-slate-300">
            The key rule is simple:
          </p>
          <p className="mb-4 rounded-xl border border-teal-500/40 bg-slate-950/60 p-3 text-sm text-slate-100">
            <span className="font-semibold text-teal-200">
              linkmint.co only pays you after the affiliate partner has paid
              linkmint.co.
            </span>{" "}
            Pending earnings are not cash yet. Approved and paid-out commissions
            are.
          </p>

          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Most merchants have a 30–90 day review/lock window.</li>
            <li>• Approved commissions move toward payout eligibility.</li>
            <li>
              • Once your payout-eligible balance passes the minimum threshold,
              you can request payout (for example, via PayPal).
            </li>
          </ul>

          <p className="mt-4 text-xs text-slate-400">
            If you want full detail with examples, jump to{" "}
            <Link
              href="/payouts"
              className="font-semibold text-teal-300 underline decoration-teal-500/60 decoration-dotted underline-offset-2 hover:text-teal-200"
            >
              Payouts Explained
            </Link>
            .
          </p>
        </section>

        {/* 5. Quick start steps */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            5. Quick start checklist
          </h2>

          <ol className="space-y-2 text-sm text-slate-300">
            <li>1. Create your account and log in to the dashboard.</li>
            <li>2. Visit the tutorial inside linkmint.co if you’re new.</li>
            <li>3. Pick one or two merchants to start with.</li>
            <li>4. Generate a smart link for a real product you’d recommend.</li>
            <li>5. Share that link in a natural, non-spammy way.</li>
            <li>6. Check your dashboard for clicks and pending earnings.</li>
            <li>
              7. Wait for commissions to be approved and paid, then request
              payout once you meet the minimum.
            </li>
          </ol>
        </section>

        {/* Final CTA row */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 text-sm text-slate-300">
          <p className="max-w-md text-xs text-slate-400">
            Once this flow feels clear, the rest is just consistency: share good
            links, respect the rules, and watch your approved commissions grow.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/tutorial"
              className="inline-flex items-center rounded-full border border-slate-600 bg-slate-900/70 px-4 py-1.5 font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800"
            >
              Open tutorial
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full border border-teal-400/60 bg-teal-500/10 px-4 py-1.5 font-semibold uppercase tracking-wide text-teal-100 hover:bg-teal-500/20"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
