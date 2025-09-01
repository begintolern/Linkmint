// app/settings/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import Link from "next/link";

// client components
import PayoutMethodCard from "@/components/dashboard/PayoutMethodCard";

export default async function SettingsPage() {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;

  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-gray-600">
            Manage your account and payout preferences.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm underline">Back to dashboard</Link>
      </header>

      {/* Profile summary */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-1">Profile</h2>
        <p className="text-sm text-gray-600 mb-3">
          These details come from your account provider.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Name</div>
            <div className="font-medium">{name || "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">Email</div>
            <div className="font-medium">{email || "—"}</div>
          </div>
        </div>
      </section>

      {/* Payout method (reuse the same card from dashboard) */}
      <section>
        <PayoutMethodCard />
      </section>
    </main>
  );
}
