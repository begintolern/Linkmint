// app/trust-center/page.tsx  (English; adds a TL switch link)
"use client";

import Link from "next/link";

export default function TrustCenterEN() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-6 w-6 rounded-md bg-emerald-500" />
            <span>linkmint.co</span>
          </Link>
          <Link
            href="/trust-center/tl"
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            TL
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold">Trust Center</h1>
        <p className="mt-4 text-gray-700">
          linkmint.co only pays out after we actually receive funds from the affiliate partner.
          Even with a high TrustScore, early payouts never occur until funds are received.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card title="Clear Payout Rule" desc="No payouts until the partner marks commissions 'Approved' and funds are received." />
          <Card title="Honeymoon Period (30 Days)" desc="During your first 30 days, early payout is locked. After that, it may unlock if you're trusted and float is available." />
          <Card title="Early Payouts (If Available)" desc="Allowed only using cleared funds (Amazon excluded), strong TrustScore, and within float capacity." />
          <Card title="Transparent Status" desc="Your dashboard shows 'Pending', 'Approved', or 'Paid' with dates and timing details." />
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Back to Landing
          </Link>
        </div>
      </section>
    </main>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}
