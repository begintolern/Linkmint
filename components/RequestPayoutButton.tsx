"use client";

import { useMemo, useState } from "react";

type Props = {
  userId: string; // pass the logged-in user's id
};

export default function RequestPayoutButton({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [amountPhp, setAmountPhp] = useState<number>(500);
  const [method, setMethod] = useState<"GCASH" | "BANK">("GCASH");
  const [gcashNumber, setGcashNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  // --- Client-side validation ---
  const isAmountValid = Number.isFinite(amountPhp) && amountPhp >= 500;
  const isGcashValid =
    method !== "GCASH" || (/^\d{11}$/.test(gcashNumber) && gcashNumber.startsWith("09"));
  const isBankValid =
    method !== "BANK" || (bankName.trim().length > 1 && bankAccountNumber.trim().length > 5);

  const canSubmit = useMemo(() => {
    if (!isAmountValid) return false;
    if (method === "GCASH") return isGcashValid;
    if (method === "BANK") return isBankValid;
    return false;
  }, [isAmountValid, method, isGcashValid, isBankValid]);

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payouts/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId, // TEMP auth for local testing
        },
        body: JSON.stringify({
          amountPhp,
          method,
          gcashNumber: method === "GCASH" ? gcashNumber : undefined,
          bankName: method === "BANK" ? bankName : undefined,
          bankAccountNumber: method === "BANK" ? bankAccountNumber : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ ok: false, text: data?.error || "Request failed" });
      } else {
        setToast({ ok: true, text: `✅ Request created: ${data.payoutRequest.id}` });
        // reset minimal fields
        setAmountPhp(500);
        setGcashNumber("");
        setBankName("");
        setBankAccountNumber("");
        setOpen(false);
      }
    } catch (e: any) {
      setToast({ ok: false, text: e?.message || "Network error" });
    } finally {
      setLoading(false);
      // auto-hide toast after a few seconds
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded-lg border"
      >
        Request Payout
      </button>

      {/* Tiny toast */}
      {toast && (
        <div
          className={`mt-2 text-sm px-3 py-2 rounded-lg shadow ${
            toast.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {toast.text}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Request Payout</h2>
              <button onClick={() => setOpen(false)} className="text-sm">
                ✕
              </button>
            </div>

            <label className="block text-sm">
              Amount (₱)
              <input
                type="number"
                min={500}
                value={amountPhp}
                onChange={(e) => setAmountPhp(parseInt(e.target.value || "0", 10))}
                className="mt-1 w-full rounded border px-2 py-1"
              />
              <span
                className={`text-xs ${
                  isAmountValid ? "text-gray-500" : "text-red-600"
                }`}
              >
                {isAmountValid ? "Minimum ₱500. Best value at ₱1,000+." : "Minimum payout is ₱500."}
              </span>
            </label>

            <label className="block text-sm">
              Method
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "GCASH" | "BANK")}
                className="mt-1 w-full rounded border px-2 py-1"
              >
                <option value="GCASH">GCash</option>
                <option value="BANK">Bank transfer</option>
              </select>
            </label>

            {method === "GCASH" ? (
              <label className="block text-sm">
                GCash Number (11 digits)
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={gcashNumber}
                  onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="09XXXXXXXXX"
                  className="mt-1 w-full rounded border px-2 py-1"
                />
                <span className={`text-xs ${isGcashValid ? "text-gray-500" : "text-red-600"}`}>
                  {isGcashValid ? "Example: 09171234567" : "Enter a valid 11-digit number starting with 09"}
                </span>
              </label>
            ) : (
              <>
                <label className="block text-sm">
                  Bank Name
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-1 w-full rounded border px-2 py-1"
                  />
                </label>
                <label className="block text-sm">
                  Bank Account Number
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="mt-1 w-full rounded border px-2 py-1"
                  />
                </label>
                {!isBankValid && (
                  <span className="text-xs text-red-600">
                    Enter a valid bank name and account number.
                  </span>
                )}
              </>
            )}

            <div className="text-xs text-gray-600">
              Fees: ₱15 InstaPay or ~2% GCash (deducted by bank/wallet).
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={submit}
                disabled={loading || !canSubmit}
                className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
