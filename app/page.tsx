export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";
import StickyHeader from "./components/StickyHeader";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <StickyHeader />

      {/* Hero */}
      <section className="relative isolate pt-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 to-white" />
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <h1 className="text-4xl/tight sm:text-5xl font-bold tracking-tight">
              Earn from every link you share.
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl">
              Turn everyday recommendations into payouts—no audience required.
              Linkmint matches your links with affiliate programs and tracks
              commissions automatically, end-to-end.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-md bg-slate-900 px-5 py-3 text-white"
              >
                Get started
              </Link>
              <Link
                href="/trust-center"
                className="inline-flex items-center rounded-md border px-5 py-3 hover:bg-slate-50"
              >
                Learn more
              </Link>
            </div>

            <div className="mt-6 text-sm text-slate-500">
              Built for trust • Email verification • Transparent payouts
            </div>
          </div>

          {/* Right card */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">
                    Smart Link
                  </div>
                  <div className="mt-1 font-semibold">
                    Your unified tracking link
                  </div>
                </div>
                <div className="h-10 w-10 rounded-md bg-gradient-to-br from-indigo-600 to-sky-500" />
              </div>

              <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm font-mono">
                https://linkmint.co/smartlink/PRODUCT-ID
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>Auto-detects eligible affiliate programs</li>
                <li>Tracks clicks, conversions, and payouts</li>
                <li>Share anywhere—social, chat, email</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* (rest of sections unchanged) */}
    </main>
  );
}
