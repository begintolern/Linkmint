// components/LandingHowItWorksSection.tsx

import Link from "next/link";

export default function LandingHowItWorksSection() {
  return (
    <section className="w-full border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        {/* Title + summary */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
            How linkmint.co works
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-700">
            Share smart links to products people already want, let affiliate
            networks track the purchases, and once they pay linkmint.co, you
            receive{" "}
            <span className="font-semibold text-teal-700">
              70–85% of the commission
            </span>{" "}
            (with an optional{" "}
            <span className="font-semibold text-amber-600">5% override</span>{" "}
            for your inviter).
          </p>
        </div>

        {/* 3-column quick explainer */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              1 · Share
            </h3>
            <p className="mt-2 text-xs text-gray-600">
              Pick supported merchants, turn product URLs into smart links, and
              share them in normal conversations and posts (within each
              merchant&apos;s rules).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              2 · Earn
            </h3>
            <p className="mt-2 text-xs text-gray-600">
              When people buy through your links and the affiliate partner
              approves the order, commissions flow to linkmint.co and{" "}
              <span className="font-semibold text-teal-700">
                70–85% goes to you
              </span>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
              3 · Cash out
            </h3>
            <p className="mt-2 text-xs text-gray-600">
              Once commissions are marked approved, paid to linkmint.co, and
              your balance passes the minimum, you can request payout (for
              example, via PayPal), with standard fees deducted.
            </p>
          </div>
        </div>

        {/* Links row */}
        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            href="/how-it-works"
            className="inline-flex items-center rounded-full border border-teal-600/60 bg-teal-50 px-4 py-1.5 font-semibold uppercase tracking-wide text-teal-700 hover:bg-teal-100"
          >
            Full “How it works”
          </Link>
          <Link
            href="/referrals"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 font-semibold uppercase tracking-wide text-gray-700 hover:bg-slate-50"
          >
            Referral rules
          </Link>
          <Link
            href="/payouts"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 font-semibold uppercase tracking-wide text-gray-700 hover:bg-slate-50"
          >
            Payouts explained
          </Link>
          <Link
            href="/tutorial"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 font-semibold uppercase tracking-wide text-gray-700 hover:bg-slate-50"
          >
            Open tutorial
          </Link>
        </div>
      </div>
    </section>
  );
}
