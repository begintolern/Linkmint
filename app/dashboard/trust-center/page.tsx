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

      {/* 💸 How Payouts Work */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-gray-900">
          💸 How Payouts Work
        </h2>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Payouts are released only after linkmint.co has received funds from
          the affiliate network. Even with a high TrustScore, payouts cannot be
          released until the merchant confirms and pays the commission.
        </p>
        <p className="text-sm sm:text-base text-gray-600 italic">
          🇵🇭 Ang payout ay mangyayari lamang kapag natanggap na ng linkmint.co
          ang komisyon mula sa affiliate partner.
        </p>
      </section>

      {/* 🌍 PH vs US Eligibility */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-slate-900">
          🌍 PH vs US Eligibility
        </h2>
        <ul className="list-disc list-inside text-sm sm:text-base text-slate-800 space-y-2">
          <li>Eligibility depends on the <strong>buyer’s location</strong>, not the sharer.</li>
          <li>PH users may share globally.</li>
          <li><strong>Temu:</strong> US buyers with US delivery only.</li>
          <li>AliExpress & SHEIN: multi-region, campaign-dependent.</li>
        </ul>
      </section>

      {/* ❓ Why Commissions Sometimes Don’t Track */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-slate-900">
          ❓ Why Commissions Sometimes Don’t Track
        </h2>
        <p className="text-sm sm:text-base text-slate-700">
          Even when a purchase is completed, a commission may not always be
          recorded. Common reasons include:
        </p>
        <ul className="list-disc list-inside text-sm sm:text-base text-slate-700 space-y-2">
          <li>The buyer didn’t purchase in the same session after clicking the link</li>
          <li>The link opened inside a mobile app instead of a browser</li>
          <li>Cookies were blocked, cleared, or expired</li>
          <li>The buyer used a different device or browser</li>
          <li>The item, campaign, or region was not eligible</li>
          <li>The order was canceled or refunded</li>
        </ul>
        <p className="text-[11px] text-slate-600">
          Tracking decisions are made by the merchant and affiliate network.
          linkmint.co cannot override tracking or approval outcomes.
        </p>
      </section>

      {/* 🛒 Temu — Tracking Rules */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-slate-900">
          🛒 Temu — Tracking Rules
        </h2>
        <ul className="list-disc list-inside text-sm sm:text-base text-slate-800 space-y-2">
          <li>Session and cookie-based tracking</li>
          <li>Buyer must click and purchase in the same session</li>
          <li>Opening in the Temu app may break tracking</li>
          <li>Browser checkout is recommended</li>
          <li>US buyer + US delivery address only</li>
        </ul>
      </section>

      {/* 🛍️ AliExpress — Tracking Rules */}
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-slate-900">
          🛍️ AliExpress — Tracking Rules
        </h2>
        <ul className="list-disc list-inside text-sm sm:text-base text-slate-800 space-y-2">
          <li>Cookie and session-based tracking</li>
          <li>Campaign and item eligibility apply</li>
          <li>App opens may affect attribution</li>
          <li>No coupon or cashback traffic</li>
        </ul>
      </section>

      {/* 👗 SHEIN — Tracking Rules */}
      <section className="rounded-2xl border border-pink-200 bg-pink-50 p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-slate-900">
          👗 SHEIN — Tracking Rules
        </h2>
        <ul className="list-disc list-inside text-sm sm:text-base text-slate-800 space-y-2">
          <li>Session-based tracking</li>
          <li>Organic content traffic only</li>
          <li>App purchases may affect tracking</li>
          <li>No incentive or coupon aggregation traffic</li>
        </ul>
      </section>

      {/* 🛡️ Your Data & Security */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-gray-900">
          🛡️ Your Data & Security
        </h2>
        <p className="text-sm sm:text-base text-gray-700">
          All user data is encrypted and handled securely. linkmint.co does not
          sell or share personal information.
        </p>
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
