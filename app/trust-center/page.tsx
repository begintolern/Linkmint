// app/trust-center/page.tsx

export default function TrustCenterPage() {
  return (
    <main className="min-h-screen px-6 py-12 bg-white text-gray-800 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-teal-700 mb-6">Trust Center</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">When do I get paid?</h2>
        <p className="text-sm text-gray-700">
          Linkmint only pays users once we have received cleared funds from our affiliate partners. Most commissions take 30–45 days to be approved by the merchant. We cannot pay you before they pay us.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">What does “Pending” mean?</h2>
        <p className="text-sm text-gray-700">
          Pending means a purchase has been tracked to your smart link but is not yet approved by the affiliate network. Once the funds are approved and sent to Linkmint, your payout status will update automatically.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">How do I know this is legit?</h2>
        <p className="text-sm text-gray-700">
          Linkmint is not a get-rich-quick platform. It’s a micro-earning tool powered by real affiliate partnerships. All funds are tracked, logged, and verified before payouts. You’ll always see your balance and status in real time.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Where can I see my earnings?</h2>
        <p className="text-sm text-gray-700">
          Once logged in, go to your dashboard. You’ll see separate totals for Pending, Approved, and Paid earnings. We provide full transparency so you can trust your balance.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Can I get paid faster?</h2>
        <p className="text-sm text-gray-700">
          If you have a high TrustScore and Linkmint has already received the funds from the merchant, you may qualify for early payout. But we never pay out money we haven’t received yet.
        </p>
      </section>

      <footer className="mt-12 text-center text-sm text-gray-500">
        Questions? Contact us at <a href="mailto:admin@linkmint.co" className="underline">admin@linkmint.co</a>
      </footer>
    </main>
  );
}
