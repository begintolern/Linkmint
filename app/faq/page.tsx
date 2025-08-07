export default function FAQPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-teal-700">FAQs</h1>
      
      <div className="mb-6">
        <h2 className="font-semibold text-gray-800">How do I earn money?</h2>
        <p className="text-gray-700">
          Share your Linkmint smart link. If someone buys something using your link, and the merchant approves the commission, we send your payout.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold text-gray-800">When do I get paid?</h2>
        <p className="text-gray-700">
          As soon as Linkmint receives the cleared commission from the affiliate partner. This usually takes 30–45 days depending on the merchant.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold text-gray-800">Is there a minimum payout?</h2>
        <p className="text-gray-700">
          Yes — you must have at least $5.00 in cleared commissions to request a payout.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold text-gray-800">Do I need followers?</h2>
        <p className="text-gray-700">
          No. Linkmint works even if you have zero followers. You just need someone to buy using your link.
        </p>
      </div>
    </div>
  );
}
