// app/admin/maintenance/page.tsx
"use client";

import { useState } from "react";

type Jsonish = any;

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  return (
    <label className={`flex flex-col text-xs ${className}`}>
      <span className="mb-1 text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-[280px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </label>
  );
}

function Button({
  children,
  onClick,
  kind = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void | Promise<void>;
  kind?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const base =
    "rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    kind === "primary"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : "border border-gray-300 text-gray-800 hover:bg-gray-50";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function JsonView({ data }: { data: Jsonish }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-emerald-100">
      {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function MaintenancePage() {
  const [adminKey, setAdminKey] = useState(""); // optional; cookie gate already protects UI
  const [inviteeId, setInviteeId] = useState("");
  const [referrerId, setReferrerId] = useState("");
  const [commissionId, setCommissionId] = useState("");
  const [merchantId, setMerchantId] = useState("demo-merchant");
  const [amount, setAmount] = useState("10.00");
  const [orderId, setOrderId] = useState("");
  const [output, setOutput] = useState<Jsonish>(null);
  const [busy, setBusy] = useState(false);

  const j = (x: any) => setOutput(x);
  const asNum = (s: string) => {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  async function safeFetch(url: string, init?: RequestInit) {
    const r = await fetch(url, init);
    const ct = r.headers.get("content-type") || "";
    const text = await r.text();
    try {
      if (ct.includes("application/json")) return JSON.parse(text);
      return { ok: false, status: r.status, raw: text.slice(0, 500) };
    } catch {
      return { ok: false, status: r.status, raw: text.slice(0, 500) };
    }
  }

  // --- Admin Ops ---

  async function createUserNoRef() {
    setBusy(true);
    try {
      const email = `noref+${Date.now()}@linkmint.co`;
      const res = await safeFetch("/api/ops/dev-create-user", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
        body: JSON.stringify({ email, name: "NoRef Test", referredById: null }),
      });
      j(res);
      if (res?.ok && res?.user?.id) setInviteeId(res.user.id);
    } finally {
      setBusy(false);
    }
  }

  async function createUserReferred() {
    if (!referrerId) return j({ ok: false, error: "Provide referrerId first" });
    setBusy(true);
    try {
      const email = `ref+${Date.now()}@linkmint.co`;
      const res = await safeFetch("/api/ops/dev-create-user", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
        body: JSON.stringify({ email, name: "Referred Test", referredById: referrerId }),
      });
      j(res);
      if (res?.ok && res?.user?.id) setInviteeId(res.user.id);
    } finally {
      setBusy(false);
    }
  }

  async function createCommission() {
    if (!inviteeId) return j({ ok: false, error: "Set inviteeId first" });
    setBusy(true);
    try {
      const res = await safeFetch("/api/ops/dev-create-commission", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
        body: JSON.stringify({ userId: inviteeId, amount: asNum(amount) }),
      });
      j(res);
      if (res?.ok && res?.commission?.id) setCommissionId(res.commission.id);
    } finally {
      setBusy(false);
    }
  }

  async function finalizeCommission() {
    if (!commissionId) return j({ ok: false, error: "Set commissionId first" });
    setBusy(true);
    try {
      const res = await safeFetch(
        `/api/ops/dev-finalize-commission?commissionId=${commissionId}`,
        { headers: { ...(adminKey ? { "x-admin-key": adminKey } : {}) } }
      );
      j(res);
    } finally {
      setBusy(false);
    }
  }

  async function listPayoutsForCommission() {
    if (!commissionId) return j({ ok: false, error: "Set commissionId first" });
    setBusy(true);
    try {
      const res = await safeFetch(
        `/api/ops/dev-list-payouts?details=commission:${commissionId}`,
        { headers: { ...(adminKey ? { "x-admin-key": adminKey } : {}) } }
      );
      j(res);
    } finally {
      setBusy(false);
    }
  }

  async function listCommissions() {
    setBusy(true);
    try {
      const res = await safeFetch("/api/ops/dev-list-commissions", {
        headers: { ...(adminKey ? { "x-admin-key": adminKey } : {}) },
      });
      j(res);
    } finally {
      setBusy(false);
    }
  }

  // Public tracking endpoints (no admin header)
  async function trackClick() {
    setBusy(true);
    try {
      const res = await safeFetch("/api/track/click", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchantId,
          userId: inviteeId || null,
          source: "DIRECT",
          url: "https://merchant.example/item/123",
        }),
      });
      j(res);
    } finally {
      setBusy(false);
    }
  }

  async function trackConversion() {
    setBusy(true);
    try {
      const res = await safeFetch("/api/track/conversion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchantId,
          userId: inviteeId || null,
          orderId: orderId || ("ORDER-" + Math.random().toString(36).slice(2, 8).toUpperCase()),
          amount: asNum(amount),
          source: "DIRECT",
          status: "APPROVED",
        }),
      });
      j(res);
    } finally {
      setBusy(false);
    }
  }

  // --- NEW: Auto-Payout Dry Run Preview ---
  async function previewAutoPayout() {
    setBusy(true);
    try {
      const res = await safeFetch(
        "/api/admin/cron/auto-payout-run?take=50&dryRun=1",
        { headers: { ...(adminKey ? { "x-admin-key": adminKey } : {}) } }
      );
      j(res);
    } finally {
      setBusy(false);
    }
  }

  // --- NEW: Auto-Payout Apply (honors flag) ---
  async function applyAutoPayout() {
    setBusy(true);
    try {
      const res = await safeFetch(
        "/api/admin/cron/auto-payout-apply?take=50",
        { headers: { ...(adminKey ? { "x-admin-key": adminKey } : {}) } }
      );
      j(res);
    } finally {
      setBusy(false);
    }
  }

  async function e2eNoRef() {
    setBusy(true);
    try {
      await createUserNoRef();
      await createCommission();
      await finalizeCommission();
      await listPayoutsForCommission();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Maintenance & Test Console</h1>
          <div className="text-xs text-gray-500">Admin-only tools</div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <Box title="Admin Key (optional header)">
          <Row>
            <Field
              label="x-admin-key"
              value={adminKey}
              onChange={setAdminKey}
              placeholder="If blank, cookie gate still protects UI"
              className="grow"
            />
          </Row>
        </Box>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Box title="Users">
            <Row>
              <Field
                label="inviteeId (target user)"
                value={inviteeId}
                onChange={setInviteeId}
                placeholder="User ID to test"
                className="grow"
              />
              <Field
                label="referrerId (optional)"
                value={referrerId}
                onChange={setReferrerId}
                placeholder="User ID as referrer"
                className="grow"
              />
            </Row>
            <Row>
              <Button onClick={createUserNoRef} disabled={busy}>
                Create User (no referrer)
              </Button>
              <Button onClick={createUserReferred} disabled={!referrerId || busy}>
                Create User (with referrer)
              </Button>
            </Row>
          </Box>

          <Box title="Commission & Payouts">
            <Row>
              <Field
                label="commissionId"
                value={commissionId}
                onChange={setCommissionId}
                placeholder="Commission ID"
                className="grow"
              />
              <Field
                label="amount (USD)"
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="10.00"
              />
            </Row>
            <Row>
              <Button onClick={createCommission} disabled={!inviteeId || busy}>
                Create Commission
              </Button>
              <Button onClick={finalizeCommission} disabled={!commissionId || busy}>
                Finalize Commission
              </Button>
              <Button onClick={listPayoutsForCommission} disabled={!commissionId || busy}>
                List Payouts (by commission)
              </Button>
            </Row>
          </Box>

          <Box title="Clicks & Conversions">
            <Row>
              <Field
                label="merchantId"
                value={merchantId}
                onChange={setMerchantId}
                placeholder="demo-merchant"
              />
              <Field
                label="orderId (optional)"
                value={orderId}
                onChange={setOrderId}
                placeholder="autogenerate if blank"
              />
            </Row>
            <Row>
              <Button kind="ghost" onClick={trackClick} disabled={busy}>
                Track Click
              </Button>
            </Row>
            <Row>
              <Button kind="ghost" onClick={trackConversion} disabled={busy}>
                Track Conversion
              </Button>
            </Row>
          </Box>

          {/* Auto-Payout Panels */}
          <Box title="Auto-Payout (Dry Run)">
            <Row>
              <Button onClick={previewAutoPayout} disabled={busy}>
                Preview Auto-Payout (dry run)
              </Button>
            </Row>
            <p className="text-xs text-gray-500">
              Shows who <em>would</em> be paid if auto-payout were enabled. This does not write to the DB.
            </p>
          </Box>

          <Box title="Auto-Payout (Apply — honors flag)">
            <Row>
              <Button onClick={applyAutoPayout} disabled={busy}>
                Apply Auto-Payout (writes only if enabled)
              </Button>
            </Row>
            <p className="text-xs text-gray-500">
              If <code>AUTO_PAYOUT_ENABLED</code> is <strong>false</strong>, this returns a disabled response (no changes).
            </p>
          </Box>

          <Box title="Lists & Shortcuts">
            <Row>
              <Button kind="ghost" onClick={listCommissions} disabled={busy}>
                List Recent Commissions
              </Button>
              <Button onClick={e2eNoRef} disabled={busy}>
                E2E (No Ref): Create → Finalize → Payouts
              </Button>
            </Row>
          </Box>
        </div>

        <Box title="Output">
          <JsonView data={output ?? "—"} />
        </Box>
      </section>
    </main>
  );
}
