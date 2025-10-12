// app/trust-center/tl/page.tsx  (Tagalog; adds an EN switch link)
"use client";

import Link from "next/link";

export default function TrustCenterTL() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-6 w-6 rounded-md bg-emerald-500" />
            <span>linkmint.co</span>
          </Link>
          <Link
            href="/trust-center"
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            EN
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold">Trust Center</h1>
        <p className="mt-4 text-gray-700">
          Ang linkmint.co ay nagbabayad lamang kapag natanggap na namin ang pondo mula sa affiliate partner.
          Kahit mataas ang TrustScore, hindi maaaga ang payout kung wala pang natatanggap na pondo.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card title="Malinaw na Payout Rule" desc="Walang payout hangga’t hindi 'Approved' at hindi pa natatanggap ang pondo mula sa partner network." />
          <Card title="Honeymoon Period (30 Araw)" desc="Sa unang 30 araw, naka-lock ang maagang payout. Pagkatapos nito, posibleng ma-unlock kung trusted at may float." />
          <Card title="Early Payouts (Kung Available)" desc="Pinapayagan lang gamit ang na-clear na pondo (hindi kasama ang Amazon), mataas na TrustScore, at may natitirang float." />
          <Card title="Transparent Status" desc="Makikita mo sa dashboard kung 'Pending', 'Approved', o 'Paid' ang komisyon—kasama ang mga petsa." />
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Bumalik sa Landing
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
