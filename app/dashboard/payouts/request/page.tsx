// app/dashboard/payouts/request/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { useEffect, useMemo, useState } from "react";

type Method = "GCASH" | "BANK";

type ApiResp =
  | {
      success: true;
      request: {
        id: string;
        status: string;
        provider: string;
        method: string;
        amountPhp: number;
        createdAt: string;
      };
      note?: string;
    }
  | {
      success: false;
      error: string;
      message?: string;
      details?: any;
      detail?: string;
    };

type Eligibility = {
  ok: boolean;
  user?: { id: string; email: string | null };
  daysSinceJoin?: number;
  minDays?: number;
  approvedUnpaidCount?: number;
  approvedUnpaidPhp?: number;
  eligible?: boolean;
  message?: string;
  error?: string;
};

export default function RequestPayoutPage() {
  const [method, setMethod] = useState<Method>("GCASH");
  const [amountPhp, setAmountPhp] = useState<string>("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResp | null>(null);

  const [elig, setElig] = useState<Eligibility | null>(null);
  const [eligLoading, setEligLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; text: string } | null>(null);

  const amountInt = useMemo(() => {
    const n = Number(amountPhp);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }, [amountPhp]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setEligLoading(true);
      try {
        const res = await fetch("/api/user/payouts/eligibility", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        let data: Eligibility;
        if (!res.ok) {
          const allowDev =
            process.env.NEXT_PUBLIC_ALLOW_DEV_BYPASS === "1" ||
            process.env.ALLOW_DEV_PAYOUTS_REQUEST === "1" ||
            process.env.ALLOW_DEV_PAYOUTS_REQUEST_BYPASS === "1";
          const devId = process.env.NEXT_PUBLIC_DEV_USER_ID || process.env.DEV_USER_ID;
          if (allowDev && devId) {
            const r2 = await fetch(
              `/api/user/payouts/eligibility?devUserId=${encodeURIComponent(devId)}`,
              { cache: "no-store" }
            );
            data = (await r2.json()) as Eligibility;
          } else {
            data = { ok: false, error: `Fetch failed (${res.status})` };
          }
        } else {
          data = (await res.json()) as Eligibility;
        }
        if (!cancelled) setElig(data);
      } catch (e: any) {
        if (!cancelled) setElig({ ok: false, error: e?.message || "NETWORK_ERROR" });
      } finally {
        if (!cancelled) setEligLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!eligLoading && elig && elig.ok && elig.eligible === false) {
      setResult({
        success: false,
        error: "NOT_ELIGIBLE",
        message:
          elig.message ||
          "You are not yet eligible to request a payout (30-day window or no approved commissions).",
      } as any);
      return;
    }

    if (!amountInt || amountInt <= 0) {
      setResult({
        success: false,
        error: "INVALID_AMOUNT",
        message: "Enter a positive amount in PHP.",
      } as any);
      return;
    }
    if (method === "GCASH") {
      if (!/^\d{11}$/.test(gcashNumber.trim())) {
        setResult({
          success: false,
          error: "INVALID_GCASH_NUMBER",
          message: "Enter 11-digit GCash number.",
        } as any);
        return;
      }
    } else {
      if (!bankName.trim() || bankName.trim().length < 3) {
        setResult({
          success: false,
          error: "INVALID_BANK_NAME",
          message: "Enter a valid bank name.",
        } as any);
        return;
      }
      if (!bankAccountNumber.trim() || bankAccountNumber.trim().length < 6) {
        setResult({
          success: false,
          error: "INVALID_BANK_ACCOUNT",
          message: "Enter a valid account number.",
        } as any);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          amountPhp: amountInt,
          method,
          gcashNumber: method === "GCASH" ? gcashNumber.trim() : undefined,
          bankName: method === "BANK" ? bankName.trim() : undefined,
          bankAccountNumber: method === "BANK" ? bankAccountNumber.trim() : undefined,
        }),
      });

      const json = (await res.json()) as ApiResp;
      setResult(json);
      if (!res.ok) return;

      if (json.success) {
        // Soft reset
        setAmountPhp("");
        if (method === "GCASH") setGcashNumber("");
        if (method === "BANK") {
          setBankName("");
          setBankAccountNumber("");
        }

        // Reload eligibility
        try {
          const r = await fetch("/api/user/payouts/eligibility", { cache: "no-store" });
          if (r.ok) setElig((await r.json()) as Eligibility);
        } catch {}

        // Show toast
        setToast({
          show: true,
          text: `Payout request submitted: ₱${json.request.amountPhp} (${json.request.method})`,
        });
        setTimeout(() => setToast((t) => (t ? { ...t, show: false } : t)), 4000);
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: "NETWORK_ERROR",
        message: err?.message || "Request failed",
      } as any);
    } finally {
      setSubmitting(false);
    }
  }

  const notEligible = !!(elig && elig.ok && elig.eligible === false);
  const disableSubmit = submitting || notEligible;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Request Payout</h1>
          <a href="/dashboard/payouts" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100">
            ← Back to Payouts
          </a>
        </div>

        {/* Eligibility banner */}
        {!elig || eligLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm">
            Checking eligibility…
          </div>
        ) : !elig.ok ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 shadow-sm text-sm text-red-800">
            Couldn’t load eligibility. {elig.error ? `(${elig.error})` : ""}
          </div>
        ) : (
          <div
            className={`rounded-xl p-4 shadow-sm text-sm border ${
              elig.eligible
                ? "bg-green-50 border-green-300 text-green-800"
                : "bg-yellow-50 border-yellow-300 text-yellow-800"
            }`}
          >
            <div className="font-medium mb-1">{elig.message}</div>
            <div className="text-xs">
              Days since join: <strong>{elig.daysSinceJoin}</strong> / Required:{" "}
              <strong>{elig.minDays}</strong> • Approved (unpaid) commissions:{" "}
              <strong>{elig.approvedUnpaidCount}</strong>
              {typeof elig.approvedUnpaidPhp === "number" ? (
                <>
                  {" "}
                  • Approved amount (₱): <strong>{elig.approvedUnpaidPhp}</strong>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Result banners */}
        {result && (
          <>
            {result.success ? (
              <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-800 text-sm">
                <div className="font-medium mb-0.5">Request submitted.</div>
                <div>
                  ID: <span className="font-mono">{result.request.id}</span> • Amount: ₱
                  {result.request.amountPhp} • Status: {result.request.status}
                </div>
                {result.note ? <div className="text-xs mt-1">{result.note}</div> : null}
              </div>
            ) : (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800 text-sm">
                <div className="font-medium mb-0.5">Request failed</div>
                <div className="text-xs">
                  {result.error}
                  {result.message ? ` — ${result.message}` : ""}
                  {result.detail ? ` — ${result.detail}` : ""}
                </div>
                {result.details?.daysSinceJoin !== undefined && (
                  <div className="text-xs mt-1">
                    Days since join: {result.details.daysSinceJoin} / Required:{" "}
                    {result.details.daysRequired}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Info card */}
        <div className="rounded-xl border bg-white p-4 shadow-sm text-sm">
          <p className="text-gray-700">
            Payouts are available for <strong>APPROVED</strong> commissions and unlock after your first{" "}
            <strong>30 days</strong> (honeymoon period). Manual GCash and bank payouts are currently supported.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">Amount (PHP)</label>
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={amountPhp}
              onChange={(e) => setAmountPhp(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g., 500"
              required
            />
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium mb-1">Method</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMethod("GCASH")}
                className={`rounded-md border px-3 py-1 text-sm ${
                  method === "GCASH" ? "bg-black text-white border-black" : "hover:bg-gray-50"
                }`}
                aria-pressed={method === "GCASH"}
              >
                GCash
              </button>
              <button
                type="button"
                onClick={() => setMethod("BANK")}
                className={`rounded-md border px-3 py-1 text-sm ${
                  method === "BANK" ? "bg-black text-white border-black" : "hover:bg-gray-50"
                }`}
                aria-pressed={method === "BANK"}
              >
                Bank Transfer
              </button>
            </div>
          </div>

          {/* Method-specific fields */}
          {method === "GCASH" ? (
            <div>
              <label className="block text-sm font-medium mb-1">GCash Number (11 digits)</label>
              <input
                type="tel"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="09XXXXXXXXX"
                inputMode="numeric"
                pattern="\d{11}"
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="e.g., BPI"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Number</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="e.g., 1234567890"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <a href="/dashboard/payouts" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
              Cancel
            </a>
            <button
              type="submit"
              disabled={disableSubmit}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
              title={notEligible ? (elig?.message || "Not eligible yet") : "Submit payout request"}
            >
              {submitting ? "Submitting…" : notEligible ? "Not eligible yet" : "Submit Request"}
            </button>
          </div>
        </form>

        {/* TRUST CENTER: quick rules */}
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold mb-2">Trust Center: Payout Rules (Quick Read)</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>
              <strong>Approval first:</strong> Only <span className="font-medium">APPROVED</span> commissions are payable.
              Pending or unverified commissions won’t be paid out.
            </li>
            <li>
              <strong>30-day unlock:</strong> New accounts unlock payouts after the first{" "}
              <span className="font-medium">30 days</span> (honeymoon period).
            </li>
            <li>
              <strong>Identity & safety:</strong> We may request basic verification (e.g., email/phone) to protect users and prevent fraud.
            </li>
            <li>
              <strong>Fees:</strong> External payment fees may be deducted from the payout amount and shown on your receipt/ledger.
            </li>
            <li>
              <strong>Processing time:</strong> Manual GCash/Bank requests are processed on a rolling basis during business hours.
            </li>
            <li>
              <strong>No self-dealing:</strong> Self-purchases and policy violations void commissions per merchant/network rules.
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Questions? Check the Trust Center section in your dashboard or contact support.
          </p>
        </section>

        <p className="text-xs text-gray-500">
          Note: Only approved commissions are payable. Payouts unlock after 30 days from account creation.
        </p>
      </div>

      {/* Simple toast — bottom-right */}
      {toast?.show && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 shadow">
            {toast.text}
          </div>
        </div>
      )}
    </main>
  );
}
