// app/trust-center/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";

export default function TrustCenterPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">Linkmint</Link>
          <nav className="text-sm">
            <Link href="/signup" className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Trust Center</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          We designed Linkmint to be transparent and audit‑friendly for creators, partners, and networks.
          Below is an overview of how we verify users, attribute conversions, prevent abuse, and handle payouts.
        </p>

        {/* Verification */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card
            title="Account verification"
            points={[
              "Email verification is required for all accounts.",
              "Fraud checks on referral batches (3 verified invites start a 90‑day window).",
              "Event logs retained for admin review."
            ]}
          />
          <Card
            title="Attribution & tracking"
            points={[
              "Smart Links attach partner tracking where programs exist.",
              "We show status by stage: Pending → Approved → Paid.",
              "Override earnings: 5% on invitees’ approved commissions for 90 days."
            ]}
          />
          <Card
            title="Anti‑abuse"
            points={[
              "Automated flags for abnormal click/purchase patterns.",
              "Invite batching and windowed overrides limit abuse.",
              "Manual admin audit + reversible payouts when needed."
            ]}
          />
          <Card
            title="Payouts"
            points={[
              "Clear status history and running totals in dashboard.",
              "Auto‑payout can be toggled by admin; manual override supported.",
              "Reconciliation via logs; decimal‑safe calculations."
            ]}
          />
        </div>

        {/* System Health */}
        <div className="mt-12 rounded-xl border p-6">
          <h2 className="text-xl font-semibold">System health & transparency</h2>
          <p className="mt-2 text-slate-600">
            We keep an internal health check for the database connection and environment configuration.
            Admins can review payout logs, commission states, and referral group activity.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge>Email verified accounts</Badge>
            <Badge>Commission stage tracking</Badge>
            <Badge>Admin event logs</Badge>
            <Badge>Manual payout override</Badge>
          </div>
          <div className="mt-6 text-sm">
            For details, see:{" "}
            <Link href="/privacy" className="underline hover:text-slate-700">Privacy</Link>{" "}
            and{" "}
            <Link href="/terms" className="underline hover:text-slate-700">Terms</Link>.
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 rounded-xl border p-6 bg-slate-50">
          <h2 className="text-xl font-semibold">Contact & compliance</h2>
          <p className="mt-2 text-slate-600">
            Networks and partners can reach us for audits or policy questions.
          </p>
          <ul className="mt-3 list-disc pl-5 text-slate-700">
            <li>Email: <a className="underline" href="mailto:admin@linkmint.co">admin@linkmint.co</a></li>
            <li>Response target: within 2 business days</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-md bg-slate-900 px-5 py-3 text-white hover:bg-slate-800"
          >
            Create your account
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border px-5 py-3 hover:bg-slate-50"
          >
            Go to dashboard
          </Link>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Linkmint.</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-800">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-800">Terms</Link>
            <a href="mailto:admin@linkmint.co" className="hover:text-slate-800">admin@linkmint.co</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Card({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-xl border p-6">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {points.map((p, i) => (
          <li key={i}>• {p}</li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}
