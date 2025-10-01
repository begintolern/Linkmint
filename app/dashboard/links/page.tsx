// app/dashboard/links/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { Suspense } from "react";
import CreateSmartLinkForm from "./CreateSmartLinkForm";
import PolicyCheckWidget from "@/components/PolicyCheckWidget"; // ⬅️ new import

export default async function LinksPage() {
  return (
    <main>
      <DashboardPageHeader
        title="Smart Links"
        subtitle="Find merchants and create payout-ready links."
      />

      {/* Find Merchants */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            "Apparel",
            "Shoes",
            "Beauty",
            "Accessories",
            "Travel",
            "Pets",
            "Electronics",
            "Software",
          ].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 mb-4">
          <input
            type="text"
            placeholder='Search items or brands… (use quotes for exact)'
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Pick a category or type a brand/item."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-md border p-4">
          <Suspense
            fallback={<p className="text-sm text-gray-600">Loading merchants…</p>}
          >
            <EmptyMerchants />
          </Suspense>
        </div>
      </section>

      {/* Create Smart Link */}
      <section className="rounded-lg border p-4 space-y-6">
        <h2 className="text-lg font-medium">Create Smart Link</h2>

        {/* Client-side form that calls /api/smartlink */}
        <CreateSmartLinkForm defaultSource="" />

        {/* AI Policy Pre-Check */}
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">⚖️ Policy Pre-Check</h3>
          <PolicyCheckWidget />
        </div>
      </section>
    </main>
  );
}

function EmptyMerchants() {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-gray-700 font-medium">No merchants yet.</p>
      <p className="text-sm text-gray-600">
        Connect or apply to affiliate networks to populate your merchant list. Once approved,
        they’ll appear here for quick link creation.
      </p>
      <div className="mt-2 flex gap-2">
        <Link
          href="/admin/merchant-rules"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Manage merchant rules
        </Link>
        <Link
          href="/admin"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Go to Admin
        </Link>
      </div>
    </div>
  );
}
