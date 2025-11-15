// app/dashboard/_components/PayoutNotice.tsx
export default function PayoutNotice() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <div className="font-semibold">Payout Update</div>
      <p className="mt-1 text-sm leading-relaxed">
        linkmint.co currently processes payouts through <b>PayPal only</b>. GCash and local bank
        transfers are <b>not yet available</b>.
      </p>
      <ul className="mt-2 list-disc pl-5 text-sm">
        <li>
          Commissions are payable <b>only after merchants send funds to linkmint.co</b>.
        </li>
        <li>
          Payouts are handled <b>manually</b> and typically complete within{" "}
          <b>1–2 business days</b> once eligible.
        </li>
        <li>
          <b>Honeymoon</b> and <b>TrustScore</b> rules still apply and may affect payout timing.
        </li>
      </ul>
      <p className="mt-2 text-sm">
        Additional payout options (GCash / bank transfer) will be added in future updates.
      </p>
    </div>
  );
}
