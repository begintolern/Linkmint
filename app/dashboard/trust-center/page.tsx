// app/dashboard/trust-center/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";

export default function TrustCenterPage() {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <main className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trust Center</h1>
          <p className="text-sm text-gray-600">
            How commissions are verified, when payouts are released, and what we do to keep things fair.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs text-gray-700">
          Last updated: {lastUpdated}
        </span>
      </header>

      {/* Policy cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title="Payout method (current)"
          body={
            <>
              <p className="text-gray-700">
                Linkmint currently supports payouts via <strong>PayPal</strong> only.
                Other methods (e.g., GCash, bank, Paymaya) may be added later.
              </p>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Payouts are sent to your verified PayPal email.</li>
                <li>Fees, if any, are shown before you confirm a payout request.</li>
                <li>Minimum payout threshold applies (see Payouts page).</li>
              </ul>
            </>
          }
        />

        <Card
          title="Commission approval flow"
          body={
            <>
              <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
                <li>
                  <strong>Tracked:</strong> a click or order is attributed to your smart link.
                </li>
                <li>
                  <strong>Pending:</strong> the merchant/network confirms the order but hasn’t approved it yet.
                </li>
                <li>
                  <strong>Approved:</strong> the merchant/network approves and funds are scheduled for release.
                </li>
                <li>
                  <strong>Payable:</strong> after the network’s clearance/hold window, funds become available to request.
                </li>
              </ol>
              <p className="mt-3 text-sm text-gray-600">
                We only pay out <em>after</em> networks mark commissions <strong>Approved</strong> and funds clear to Linkmint.
              </p>
            </>
          }
        />

        <Card
          title="Cookie window & hold periods"
          body={
            <>
              <p className="text-gray-700">
                Each merchant/network defines a <strong>cookie window</strong> (attribution period) and a{" "}
                <strong>payout delay</strong> (clearance/hold time). Examples:
              </p>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Cookie window: 7–30 days typical</li>
                <li>Payout delay: 30–90 days typical after approval</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                See exact values per merchant in <Link className="underline" href="/dashboard/merchants">Merchants</Link>.
              </p>
            </>
          }
        />

        <Card
          title="Fair use & fraud protections"
          body={
            <>
              <p className="text-gray-700">
                We protect advertisers and creators with automated checks:
              </p>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Pattern checks on abnormal click/convert rates</li>
                <li>Self-purchase and incentive abuse detection</li>
                <li>Network dispute handling (chargebacks, cancellations)</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                If a commission is reversed by a network, it won’t be payable.
              </p>
            </>
          }
        />
      </div>

      {/* FAQ */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-medium mb-2">FAQs</h2>
        <div className="divide-y">
          <Faq
            q="When exactly do I get paid?"
            a={
              <>
                After a commission is <strong>Approved</strong> by the affiliate network and the network’s{" "}
                clearance period ends. Once it shows as <strong>Payable</strong> in your dashboard, you can request a payout.
              </>
            }
          />
          <Faq
            q="Do you pay for cancelled or refunded orders?"
            a="No. If the network reverses an order, it won’t be payable."
          />
          <Faq
            q="Do you allow incentivized clicks?"
            a="No. Merchants often mark incentivized traffic invalid. Use honest recommendations and disclosures."
          />
          <Faq
            q="What happens if my PayPal email is wrong?"
            a={
              <>
                Update it in <Link className="underline" href="/dashboard/settings">Settings</Link> before requesting payout.  
                If a sent payout fails, we’ll show a retry or return the funds to your balance.
              </>
            }
          />
          <Faq
            q="Can I see each merchant’s cookie window?"
            a={
              <>
                Yes — open <Link className="underline" href="/dashboard/merchants">Merchants</Link>.  
                Cookie window and payout delay are listed per merchant (where known).
              </>
            }
          />
        </div>
      </section>

      {/* Status + Contact */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4 sm:p-5">
          <h3 className="text-sm font-medium mb-2">System status</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>Tracking: <StatusDot ok /> Normal</li>
            <li>Payouts: <StatusDot ok /> Operational</li>
            <li>Networks sync: <StatusDot ok /> Normal</li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            If you suspect a delay, check your merchant’s hold window first.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 sm:p-5 md:col-span-2">
          <h3 className="text-sm font-medium mb-2">Need help?</h3>
          <p className="text-sm text-gray-700">
            Email <a className="underline" href="mailto:admin@linkmint.co">admin@linkmint.co</a> with your user ID,
            the merchant, and the order details. We’ll investigate with the network if needed.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Response times may vary based on the advertiser/network’s SLA.
          </p>
        </div>
      </section>

      {/* Mobile last-updated */}
      <div className="sm:hidden text-xs text-gray-500">
        Last updated: {lastUpdated}
      </div>
    </main>
  );
}

/* ---------- small components ---------- */

function Card({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-4 sm:p-5">
      <h2 className="text-sm sm:text-base font-medium">{title}</h2>
      <div className="mt-2 text-sm">{body}</div>
    </section>
  );
}

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="py-3">
      <summary className="cursor-pointer select-none text-sm font-medium text-gray-900">
        {q}
      </summary>
      <div className="mt-2 text-sm text-gray-700">{a}</div>
    </details>
  );
}

function StatusDot({ ok }: { ok?: boolean }) {
  const tone = ok ? "bg-emerald-500" : "bg-amber-500";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${tone} align-middle mr-2`} />;
}
