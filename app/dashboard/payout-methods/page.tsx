"use client";

import { useEffect, useState } from "react";

type GCashHealth = {
  ok: boolean;
  provider: string;
  ready: boolean;
  missingEnv: string[];
};

export default function PayoutMethodsPage() {
  const [gcash, setGcash] = useState<GCashHealth | null>(null);
  const [loading, setLoading] = useState(true);

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

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground">GCash number</label>
            <input
              type="tel"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="09XXXXXXXXX"
              disabled
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Disabled until credentials are configured.
            </p>
          </div>

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
