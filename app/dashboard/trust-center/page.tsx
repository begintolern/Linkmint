// app/dashboard/trust-center/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function TrustCenterPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-4">Trust Center</h1>
      <p className="text-gray-700 mb-4">
        Linkmint.co is built for transparency and fairness. Every payout and commission follows affiliate network approval and clearance rules.
      </p>
      <p className="text-gray-700 mb-4">
        🕒 Payouts are only processed once Linkmint has received funds from the affiliate partner. This ensures that all payments are legitimate, verified, and compliant with merchant terms.
      </p>
      <p className="text-gray-700 mb-4">
        💸 Minimum payout amount: ₱500. Payouts are currently available via GCash or PayPal. Bank or wallet fees may apply.
      </p>
      <p className="text-gray-700 mb-4">
        ⏳ New users have a short verification period before first payout eligibility, ensuring secure and fraud-free processing.
      </p>

      <p className="text-sm text-gray-600 mt-2">
        💬 <strong>Tagalog:</strong> Ang bayad ay ipoproseso kapag natanggap na ng Linkmint ang komisyon mula sa partner merchant.  
        Ito ay para matiyak na ang lahat ng bayad ay lehitimo at aprubado ng mga partner merchants.
      </p>

      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-medium mb-2">Why this matters</h2>
        <p className="text-gray-700 text-sm">
          Linkmint’s Trust Center exists to clarify that we only pay out commissions after affiliate networks have confirmed and released payment.
          This keeps all users and merchants protected from invalid transactions.
        </p>
      </div>

      <p className="text-center text-xs text-gray-400 mt-10">
        Powered by Linkmint.co | © 2025 Golden Twin Ventures Inc.
      </p>
    </div>
  );
}
