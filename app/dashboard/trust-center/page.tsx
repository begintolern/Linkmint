// app/dashboard/trust-center/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function TrustCenterPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <header className="space-y-1 sm:space-y-2">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Trust Center
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Transparency and safety are at the core of linkmint.co.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
        <h2 className="text-lg sm:text-xl font-medium text-gray-900">
          💸 How Payouts Work
        </h2>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Payouts are released only after linkmint.co has received funds from
          the affiliate network. This ensures full compliance and prevents
          fraudulent or premature withdrawals. Even if your TrustScore is high,
          payouts will not be released until affiliate payments are cleared.
        </p>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          PayPal and GCash transactions include applicable fees, which are
          automatically deducted during payout. This ensures fairness and
          transparency for all users.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
        <h2 className="text-lg sm:text-xl font-medium text-gray-900">
          🛡️ Your Data & Security
        </h2>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          All data is encrypted and handled securely. We never sell or share
          user information. Two-step verification and real-time fraud detection
          help protect accounts from misuse.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
        <h2 className="text-lg sm:text-xl font-medium text-gray-900">
          🤝 Why Users Trust linkmint.co
        </h2>
        <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 space-y-2">
          <li>All commissions are sourced directly from affiliate partners.</li>
          <li>Real-time dashboards show your full earning history.</li>
          <li>
            We don’t offer early payouts on unapproved commissions — only cleared
            earnings.
          </li>
          <li>Admin and users follow the same payout rules.</li>
        </ul>
      </section>

      <footer className="pt-4 text-xs sm:text-sm text-center text-gray-500">
        Built for transparency. Questions? Contact{" "}
        <a
          href="mailto:admin@linkmint.co"
          className="text-teal-600 hover:underline"
        >
          admin@linkmint.co
        </a>
        .
      </footer>
    </div>
  );
}
