"use client";

export default function TrustCenterPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-3xl font-semibold text-gray-900">Trust Center</h1>
      <p className="text-gray-600">
        At <strong>linkmint.co</strong>, transparency isn’t optional — it’s the foundation of how we work.
        This page explains exactly how earnings, payouts, and approvals happen, so you always know what to expect.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">🧾 How payouts work</h2>
        <p className="text-gray-700">
          Linkmint processes commissions only after the affiliate network confirms payment to us.
          This protects both users and the platform from fraud or chargebacks.
        </p>
        <p className="text-gray-700">
          You’ll see commissions move through clear stages: <b>Pending → Approved → Paid</b>.
          Even trusted users must wait for “Approved” status before payouts are eligible.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">💰 When you’ll get paid</h2>
        <p className="text-gray-700">
          Every merchant pays on their own schedule. Once Linkmint receives the funds, your payout appears automatically
          in your account balance and becomes available through PayPal.
        </p>
        <p className="text-gray-700">
          During your first 30 days, payouts unlock only after funds are received (the “honeymoon period”).
          This rule ensures fair play and keeps Linkmint sustainable for everyone.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">🛡️ Why these rules exist</h2>
        <p className="text-gray-700">
          Affiliate networks require strict validation before funds are released.
          By following these policies, Linkmint stays fully compliant and keeps your earnings safe from reversals or disputes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">🤝 Our promise</h2>
        <p className="text-gray-700">
          Linkmint will never hold your money longer than required by the networks themselves.
          Once funds are approved and cleared, payouts move automatically — no manual requests or waiting games.
        </p>
        <p className="text-gray-700">
          We believe in ethical affiliate marketing, fair payouts, and giving everyone a chance to earn honestly online.
        </p>
      </section>

      <footer className="pt-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} linkmint.co — built for trust, transparency, and everyday earners.
      </footer>
    </main>
  );
}
