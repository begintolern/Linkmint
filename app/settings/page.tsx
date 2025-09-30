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
          These details come from your sign-in provider.
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

      {/* Payout method */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Payout method</h2>
        <p className="text-xs text-gray-600 mb-3">Tax notice: You’re responsible for taxes on your earnings. We may    collect a W-9/W-8, issue required forms (e.g., 1099-NEC), and withhold or delay payouts if required by law.</p>
        <PayoutMethodCard />
      </section>

      {/* Security (stubs) */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Security</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Change password</div>
              <div className="text-gray-500">Update your password for email sign-in.</div>
            </div>
            <button className="rounded bg-gray-900 text-white px-3 py-2 text-sm opacity-60 cursor-not-allowed">
              Coming soon
            </button>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Two-factor authentication</div>
              <div className="text-gray-500">Add an extra layer of security to your account.</div>
            </div>
            <button className="rounded bg-gray-900 text-white px-3 py-2 text-sm opacity-60 cursor-not-allowed">
              Coming soon
            </button>
          </div>
        </div>
      </section>

      {/* Notifications (stubs) */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Notifications</h2>
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-3">
            <input type="checkbox" disabled className="h-4 w-4" />
            <span>Email me when I get a new commission</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" disabled className="h-4 w-4" />
            <span>Email me when a payout is processed</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-3">More options coming soon.</p>
      </section>
    </main>
  );
}
