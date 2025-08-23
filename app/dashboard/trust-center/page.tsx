// app/dashboard/trust-center/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import Link from "next/link";

export default function TrustCenterPage() {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="bg-white/70 dark:bg-zinc-900/70 rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 p-6">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{children}</div>
    </section>
  );

  const Item = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-zinc-500">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Trust Center</h1>
          <p className="text-zinc-600 dark:text-zinc-300 mt-1">
            How payouts work, when funds clear, and what we log for transparency.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-zinc-300 dark:ring-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          ← Back to Dashboard
        </Link>
      </header>

      {/* Snapshot */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-900 p-5 ring-1 ring-emerald-200/70 dark:ring-emerald-900/50">
          <div className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Policy</div>
          <div className="text-lg font-semibold mt-1">Affiliate-Cleared Payouts</div>
          <p className="text-sm mt-2 text-emerald-900/80 dark:text-emerald-200/80">
            We only pay out after the affiliate network clears funds to Linkmint.
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/30 dark:to-zinc-900 p-5 ring-1 ring-amber-200/70 dark:ring-amber-900/50">
          <div className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Window</div>
          <div className="text-lg font-semibold mt-1">Typical 30–90 Days</div>
          <p className="text-sm mt-2 text-amber-900/80 dark:text-amber-200/80">
            Networks may reverse fraud/returns; we mirror their clearance period.
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-b from-sky-50 to-white dark:from-sky-950/30 dark:to-zinc-900 p-5 ring-1 ring-sky-200/70 dark:ring-sky-900/50">
          <div className="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-300">Transparency</div>
          <div className="text-lg font-semibold mt-1">Event Logs</div>
          <p className="text-sm mt-2 text-sky-900/80 dark:text-sky-200/80">
            Every commission, referral batch, and payout is logged in EventLog.
          </p>
        </div>
      </section>

      {/* Payout Policy */}
      <Section title="Payout Policy">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-medium">Affiliate-Cleared Only:</span> We release user payouts only after the
            affiliate network settles funds to Linkmint. If they hold or reverse, we follow suit.
          </li>
          <li>
            <span className="font-medium">Clearance Window:</span> Expect <span className="font-semibold">30–90 days</span>{" "}
            from purchase to payout depending on the partner’s policy (fraud checks, returns, and network accounting).
          </li>
          <li>
            <span className="font-medium">Pending → Approved → Paid:</span> Commissions start as{" "}
            <code className="px-1 rounded bg-zinc-100 dark:bg-zinc-800">Pending</code>, move to{" "}
            <code className="px-1 rounded bg-zinc-100 dark:bg-zinc-800">Approved</code> once cleared, then{" "}
            <code className="px-1 rounded bg-zinc-100 dark:bg-zinc-800">Paid</code> when funds are sent to you.
          </li>
          <li>
            <span className="font-medium">Zero “float risk” for users:</span> we don’t front-run network payouts. This
            keeps balances accurate and prevents clawbacks.
          </li>
        </ul>
      </Section>

      {/* Lifecycle */}
      <Section title="Commission Lifecycle">
        <ol className="list-decimal pl-5 space-y-2">
          <li>User clicks a tracked link and completes a purchase.</li>
          <li>Network attributes commission to Linkmint; we record it as <strong>Pending</strong>.</li>
          <li>Network clears funds (after returns/fraud windows).</li>
          <li>We mark commission <strong>Approved</strong> and prepare payout.</li>
          <li>We disburse and mark <strong>Paid</strong>. EventLog records every state change.</li>
        </ol>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
            <Item k="Start State" v="Pending" />
          </div>
          <div className="p-3 rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
            <Item k="Cleared" v="Approved" />
          </div>
          <div className="p-3 rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
            <Item k="Final" v="Paid" />
          </div>
        </div>
      </Section>

      {/* Referral & Overrides */}
      <Section title="Referrals & Overrides (Fair Use)">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-medium">3‑Invite Batch:</span> when you invite 3 verified friends, a referral batch is
            created and logged.
          </li>
          <li>
            <span className="font-medium">Override Window:</span> inviter may earn a small percentage from invitee
            purchases for a limited window (e.g. 90 days), capped and logged for transparency.
          </li>
          <li>
            <span className="font-medium">No Multi‑Level Payouts:</span> overrides are single‑level and time‑limited.
          </li>
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          Note: Exact percentages and windows can vary by program and are always compliant with affiliate terms.
        </p>
      </Section>

      {/* Transparency & Logs */}
      <Section title="Transparency & Logs">
        <p>
          We maintain an immutable audit trail in <code>EventLog</code> for audits and support:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>commission: created/approved/paid transitions</li>
          <li>referral: batch creation, badge updates</li>
          <li>payout: disbursement attempts and results</li>
        </ul>
        <div className="mt-4 flex gap-3">
          <Link
            href="/admin/logs?type=commission"
            className="rounded-lg px-3 py-2 ring-1 ring-zinc-300 dark:ring-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
          >
            View Commission Logs (Admin)
          </Link>
          <Link
            href="/admin/logs?type=referral"
            className="rounded-lg px-3 py-2 ring-1 ring-zinc-300 dark:ring-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
          >
            View Referral Logs (Admin)
          </Link>
        </div>
      </Section>

      {/* FAQs */}
      <Section title="FAQs">
        <div className="space-y-3">
          <div>
            <div className="font-medium">When do I get paid?</div>
            <div>
              After the affiliate network clears funds to Linkmint. This typically takes 30–90 days depending on the
              program (to account for returns and fraud checks).
            </div>
          </div>
          <div>
            <div className="font-medium">Why does my commission show as Pending?</div>
            <div>
              All commissions start Pending. They move to Approved once the network confirms and settles the amount,
              then to Paid when we disburse.
            </div>
          </div>
          <div>
            <div className="font-medium">Can commissions be reversed?</div>
            <div>
              Yes—if the network reverses for returns or fraud. Our balances mirror the network; we don’t pay early to
              avoid clawbacks.
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
