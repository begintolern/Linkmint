// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import DashboardPageHeader from "@/components/DashboardPageHeader";
import Link from "next/link";
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const store = cookies();
  const email = store.get("email")?.value ?? "";
  const name = email ? email.split("@")[0] : "there";

  return (
    <>
      <DashboardPageHeader
        title="Overview"
        subtitle={`Welcome back, ${name}`}
      />

      {/* Tiles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Tile title="Smart Links" desc="Create and manage links" href="/dashboard/links" />
        <Tile title="Referrals" desc="Invite and track bonuses" href="/dashboard/referrals" />
        <Tile title="Earnings" desc="Commissions and status" href="/dashboard/earnings" />
        <Tile title="Payouts" desc="History and accounts" href="/dashboard/payouts" />
      </div>

      {/* Summary */}
      <section className="mb-8 rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-2">🪙 Earnings Summary</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Earnings</p>
            <p className="text-2xl font-semibold">$11.56</p>
          </div>
          <span className="rounded-full border px-3 py-1 text-sm text-gray-700">
            Not Eligible
          </span>
        </div>
      </section>
    </>
  );
}

function Tile({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border p-4 hover:bg-gray-50 transition-colors"
    >
      <p className="text-xs font-semibold text-gray-500 mb-1">TOOLS</p>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </Link>
  );
}
