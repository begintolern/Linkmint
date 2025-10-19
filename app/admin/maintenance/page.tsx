// app/admin/maintenance/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import AutoPayoutApplyCard from "@/components/AutoPayoutApplyCard";

export default function MaintenancePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Maintenance & Test Console
      </h1>
      <p className="text-sm text-gray-600 mt-1">Admin-only tools</p>

      {/* Admin Key */}
      <section className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          Admin Key (optional header)
        </h2>
        <p className="text-xs text-gray-600 mb-2">
          If blank, cookie gate still protects UI
        </p>
        <input
          type="password"
          placeholder="x-admin-key"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </section>

      {/* Users */}
      <section className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Users</h2>
        <p className="text-xs text-gray-600 mb-2">Create test users</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="inviteeId (target user)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="referrerId (optional)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3 mt-3">
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
            Create User (no referrer)
          </button>
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
            Create User (with referrer)
          </button>
        </div>
      </section>

      {/* Commission & Payouts */}
      <section className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          Commission & Payouts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <input
            type="text"
            placeholder="commissionId"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            defaultValue={10.0}
            step="0.01"
            placeholder="amount (USD)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3 mt-3">
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
            Create Commission
          </button>
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
            Finalize Commission
          </button>
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
            List Payouts (by commission)
          </button>
        </div>
      </section>

      {/* Clicks & Conversions */}
      <section className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          Clicks & Conversions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <input
            type="text"
            placeholder="merchantId"
            defaultValue="demo-merchant"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="orderId (optional)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3 mt-3">
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
            Track Click
          </button>
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
            Track Conversion
          </button>
        </div>
      </section>

      {/* Auto-Payout Manual Trigger */}
      <section className="mt-8">
        <AutoPayoutApplyCard />
      </section>
    </main>
  );
}
