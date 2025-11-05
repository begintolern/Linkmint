// app/dashboard/_components/PayoutNotice.tsx
export default function PayoutNotice() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <div className="font-semibold">PH payout update</div>
      <p className="mt-1 text-sm leading-relaxed">
        GCash and Bank payouts are currently processed <b>manually</b> after funds clear from
        merchants. Expected processing time: <b>1–2 business days</b> once eligible.
      </p>
      <ul className="mt-2 list-disc pl-5 text-sm">
        <li>Only <b>approved</b> commissions are payable.</li>
        <li>Honeymoon &amp; TrustScore rules still apply.</li>
        <li>PayPal remains available where applicable.</li>
      </ul>
    </div>
  );
}
