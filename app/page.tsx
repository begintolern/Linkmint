// app/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* Logo from /public/logo.png */}
            <Image
              src="/logo.png"
              alt="Linkmint logo"
              width={32}
              height={32}
              priority
            />
            <span className="font-semibold tracking-tight">Linkmint</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/trust-center" className="hover:text-slate-600">
              Trust Center
            </Link>
            <Link href="/faq" className="hover:text-slate-600">
              FAQ
            </Link>
            <Link href="/login" className="hover:text-slate-600">
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-white"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate">
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

      {/* How it works */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Card
              step="01"
              title="Create your account"
              body="Verify your email and get your dashboard. No approval required."
            />
            <Card
              step="02"
              title="Turn any link into a Smart Link"
              body="Paste a product or site URL. We attach tracking and route to active programs."
            />
            <Card
              step="03"
              title="Share, track, and get paid"
              body="We attribute purchases, show earnings in real-time, and handle program rules."
            />
          </div>
        </div>
      </section>

      {/* Referral */}
      <section className="border-t bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold">Referral boost</h2>
          <p className="mt-3 text-slate-600">
            Invite friends and unlock a 90-day 5% override on their approved
            commissions. We batch referrals in groups of three to keep things
            fair and fraud-safe.
          </p>

          <div className="mt-6">
            <Link
              href="/dashboard/referrals"
              className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-slate-50"
            >
              View referral program
            </Link>
          </div>

          <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold">Example referral batch</h3>
            <p className="mt-2 text-sm text-slate-600">
              3 verified invitees start your 90-day window. You earn 5% on their
              approved commissions. TrustScore improves with healthy activity.
            </p>
            <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              Tip: consistent, organic sharing builds the most value.
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-16 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <h2 className="text-2xl font-semibold">Built for trust</h2>
            <p className="mt-3 text-slate-600">
              Linkmint is designed with transparency and safety in mind:
              clear attribution, email verification, fraud checks, and an
              audit-friendly trail.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>Transparent earnings and payout history</li>
              <li>Admin oversight &amp; event logs</li>
              <li>Respectful email policy and opt-outs</li>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/trust-center"
                className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-slate-50"
              >
                Visit Trust Center
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-slate-50"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-slate-50"
              >
                Terms
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border p-5 shadow-sm">
              <h3 className="font-semibold">System status</h3>
              <p className="mt-2 text-sm text-slate-600">
                Real-time health checks, reversible payouts, and manual overrides to keep things safe.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <Badge label="Email Verified" />
                <Badge label="Payouts Tracked" />
                <Badge label="Admin Audited" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16 flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold">Ready to earn from your links?</h2>
          <p className="mt-3 max-w-xl text-slate-600">
            Start free. Create Smart Links in seconds. Share anywhere.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-md bg-slate-900 px-5 py-3 text-white"
            >
              Create your account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-md border px-5 py-3 hover:bg-slate-100"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-600 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} Linkmint. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-800">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-800">Terms</Link>
            <a href="mailto:admin@linkmint.co" className="hover:text-slate-800">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Card({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-slate-500">{step}</div>
      <div className="mt-1 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center justify-center rounded-md border px-3 py-2">
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  );
}
