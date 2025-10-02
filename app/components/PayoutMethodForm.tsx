// app/components/PayoutMethodForm.tsx
"use client";
import { useState } from "react";
import { ALLOW_NON_PAYPAL } from "@/lib/config/payouts";

export default function PayoutMethodForm({ onSubmit }: { onSubmit: (v: { destination: string }) => void }) {
  const [paypalEmail, setPaypalEmail] = useState("");

  // Non-PayPal UI is hidden entirely while ALLOW_NON_PAYPAL === false
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ destination: paypalEmail.trim() });
      }}
    >
      <div>
        <label className="block text-sm font-medium">Payout Method</label>
        <div className="mt-1 text-sm">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1">
            PayPal (USD)
          </span>
          {!ALLOW_NON_PAYPAL && (
            <span className="ml-2 text-xs text-gray-500">
              Other methods (GCash/Maya) not supported yet.
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">PayPal Email</label>
        <input
          type="email"
          required
          value={paypalEmail}
          onChange={(e) => setPaypalEmail(e.target.value)}
          className="mt-1 w-full rounded-md border p-2"
          placeholder="name@example.com"
          autoComplete="email"
        />
      </div>

      <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">
        Save Payout Method
      </button>
    </form>
  );
}
