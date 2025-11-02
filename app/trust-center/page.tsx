// app/trust-center/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";

export default function TrustCenterPage() {
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-10 text-gray-900">
      {/* Hero */}
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">Trust Center</h1>
        <p className="text-gray-600">
          Linkmint pays real money for real purchases. We’re strict (on purpose)
          so the system stays fair and sustainable for everyone.
        </p>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-emerald-900 text-sm">
            <strong>Core rule:</strong> We only pay out after the affiliate
            network sends funds to Linkmint (<i>approved</i>, not pending).
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Quick links</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TrustLink href="/dashboard/create-link" label="Create Smart Link" />
          <TrustLink href="/dashboard/links" label="Your Recent Links" />
          <TrustLink href="/dashboard/payouts" label="Payouts & Accounts" />
          <TrustLink href="/dashboard/merchants" label="Merchant Rules" />
          <TrustLink href="/dashboard/merchants/ai" label="AI Suggestions (beta)" />
          <TrustLink href="/tutorial" label="How it Works (Tutorial)" />
        </div>
      </section>

      {/* PH payout timeline (GCash, ₱ examples) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Payout timeline (PH)</h2>

        <TimelineItem
          title="Day 0–1: Purchase happens"
          desc="Your link drives a real purchase on Lazada/Shopee (or other supported merchant). It appears as Pending in Linkmint."
          peso="₱0 (no payout yet)"
        />
        <TimelineItem
          title="~Day 2–30: Waiting for approval"
          desc="Merchant/network verifies the order. Cancellations/returns void earnings. When approved, it moves to Approved."
          peso="Sample: ₱180 pending → ₱180 approved"
        />
        <TimelineItem
          title="After approval: Funds sent to Linkmint"
          desc="Only after we receive funds from the network does the amount become Eligible for payout."
          peso="₱180 becomes Eligible"
        />
        <TimelineItem
          title="Payout to you (GCash)"
          desc="Eligible balance can be sent to your verified GCash. You’ll see fees/FX if applicable and a final net ₱ amount."
          peso="Example: ₱180 gross → ₱176.50 net (illustrative)"
        />

        <div className="rounded-lg border p-4 text-sm text-gray-700">
          <p className="mb-2">
            <strong>Heads up:</strong> Some merchants take longer than 30 days
            to approve. We never float unpaid funds for merchants that haven’t
            paid Linkmint yet.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Amazon is excluded from early payouts (approval first).</li>
            <li>We may batch small amounts to minimize fees.</li>
          </ul>
        </div>
      </section>

      {/* Compliance & integrity rules (PH-focused) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Compliance & integrity</h2>

        <RuleBlock
          title="Merchant policies apply"
          points={[
            "Gift cards, coupon stacking, or prohibited categories may be excluded.",
            "Self-purchase or abuse is disallowed by many merchants and may void commissions.",
          ]}
        />
        <RuleBlock
          title="Cookie windows & returns"
          points={[
            "Earnings depend on the merchant’s cookie window and final approval.",
            "Returns, cancellations, or fraud checks can reduce/void commissions.",
          ]}
        />
        <RuleBlock
          title="One real person, one account"
          points={[
            "No multi-accounting, fake traffic, bots, or misleading content.",
            "We audit patterns and disable abusive accounts to protect everyone.",
          ]}
        />
        <RuleBlock
          title="PH age policy"
          points={[
            "Only users 18+ can receive payouts.",
            "Under 18 may share/learn, but payouts must go to a verified adult (guardian) account.",
          ]}
        />
      </section>

      {/* FAQ (short) */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">FAQ (quick)</h2>
        <div className="space-y-4">
          <Faq
            q="Do I need Lazada/Shopee accounts to browse?"
            a="No to browse; yes to buy. Merchants may prompt login to view prices, add to cart, or complete checkout."
          />
          <Faq
            q="Why is my payout not instant?"
            a="Because merchants must approve and pay Linkmint first. Once funds arrive, your balance becomes Eligible."
          />
          <Faq
            q="Can I use GCash?"
            a="Yes. Add your verified GCash in Payouts. We’ll show any applicable fees/FX before you confirm."
          />
        </div>
      </section>

      {/* Footer/helper */}
      <section className="rounded-xl bg-gray-50 border p-4 text-sm text-gray-700">
        Questions or concerns?{" "}
        <Link href="/contact" className="underline hover:text-emerald-700">
          Contact support
        </Link>
        .
      </section>
    </main>
  );
}

/* ---------- Small components ---------- */

function TrustLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm hover:bg-gray-50"
    >
      {label}
    </Link>
  );
}

function TimelineItem({
  title,
  desc,
  peso,
}: {
  title: string;
  desc: string;
  peso: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-600" />
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-gray-700 text-sm">{desc}</p>
        <p className="text-xs text-gray-500">Illustrative: {peso}</p>
      </div>
    </div>
  );
}

function RuleBlock({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="font-medium">{q}</p>
      <p className="text-sm text-gray-700">{a}</p>
    </div>
  );
}
