"use client";

import { useEffect, useState } from "react";

type GCashHealth = {
  ok: boolean;
  provider: string;
  ready: boolean;
  missingEnv: string[];
};

type SimResult = {
  ok: boolean;
  mode?: string;
  provider?: string;
  message?: string;
  missingEnv?: string[];
  echo?: { amountPhp?: number; gcashNumber?: string };
  error?: string;
};

export default function PayoutMethodsPage() {
  const [gcash, setGcash] = useState<GCashHealth | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate section state (no DB writes)
  const [gcashNumber, setGcashNumber] = useState("09171234567");
  const [amountPhp, setAmountPhp] = useState<number>(100);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/payouts/gcash", { cache: "no-store" });
        const data = (await res.json()) as GCashHealth;
        if (alive) setGcash(data);
      } catch {
        if (alive) setGcash(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function simulateGCash() {
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/payouts/gcash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPhp: Number(amountPhp || 0), gcashNumber }),
        cache: "no-store",
      });
      const data = (await res.json()) as SimResult;
      setSimResult(data);
    } catch (e: any) {
      setSimResult({ ok: false, error: String(e?.message ?? e) });
    } finally {
      setSimLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Payout Methods</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose how you want to get paid. Some options may be unavailable until verification is complete.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* PayPal */}
        <div className="rounded-2xl border p-4">
          <h2 className="font-medium">PayPal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Active now. Fees are deducted automatically.
          </p>
          <div className="mt-3 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Active
          </div>
        </div>

        {/* GCash */}
        <div className="rounded-2xl border p-4">
          <h2 className="font-medium">GCash</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pre-provisioned. Will activate after PH corporate + banking verification.
          </p>

          {/* Readiness indicator */}
          <div className="mt-3">
            {loading ? (
              <span className="text-xs text-muted-foreground">Checking status…</span>
            ) : gcash ? (
              <div className="text-xs">
                <div>
                  Status:{" "}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 ${
                      gcash.ready
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {gcash.ready ? "Ready (credentials present)" : "Simulated (credentials missing)"}
                  </span>
                </div>
                {!gcash.ready && gcash.missingEnv?.length > 0 && (
                  <div className="mt-1">
                    Missing env:{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5">
                      {gcash.missingEnv.join(", ")}
                    </code>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-red-600">Unable to check GCash status.</span>
            )}
          </div>

          {/* Simulate payout (no DB writes) */}
          <div className="mt-4 rounded-xl border p-3">
            <div className="text-xs font-medium mb-2">Simulate GCash payout</div>
            <label className="block text-xs text-muted-foreground">GCash number (not saved)</label>
            <input
              type="tel"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="09XXXXXXXXX"
              value={gcashNumber}
              onChange={(e) => setGcashNumber(e.target.value)}
            />

            <label className="mt-3 block text-xs text-muted-foreground">Amount (PHP)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="100"
              value={amountPhp}
              onChange={(e) => setAmountPhp(Number(e.target.value))}
              min={1}
            />

            <button
              onClick={simulateGCash}
              disabled={simLoading || !gcashNumber || Number(amountPhp) <= 0}
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              {simLoading ? "Simulating…" : "Simulate GCash payout"}
            </button>

            {simResult && (
              <div className="mt-3 rounded-lg border p-2 text-xs">
                <div className="font-medium mb-1">Result</div>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              </div>
            )}

            <p className="mt-2 text-[11px] text-muted-foreground">
              This tool sends a request to <code>/api/payouts/gcash</code>. It does not save your number
              or transfer funds. Live transfers will only be enabled after credentials are configured.
            </p>
          </div>
        </div>

        {/* Bank transfer */}
        <div className="rounded-2xl border p-4">
          <h2 className="font-medium">Bank Transfer (PH)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Coming later after local rails are finalized.
          </p>
          <div className="mt-3 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Coming later
          </div>
        </div>
      </div>
    </div>
  );
}
