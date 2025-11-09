// app/dashboard/DashboardClient.tsx
"use client";

import Link from "next/link";
import ColoredStats from "./_components/ColoredStats";
import PayoutNotice from "./_components/PayoutNotice";

type Props = {
  userId: string;
  email?: string | null;
};

export default function DashboardClient({ userId, email }: Props) {
  const safeEmail = email || "—";

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="text-sm text-gray-600">
          <span className="font-mono">{safeEmail}</span>
        </div>
      </div>

      {/* >>> Restored 6 colored cards <<< */}
      <ColoredStats />

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <CardLink
          href="/dashboard/create-link"
          title="Create SmartLink"
          subtitle="Make a new link to share"
        />
        <CardLink
          href="/dashboard/links"
          title="Your Links"
          subtitle="View and manage links"
        />
        <CardLink
          href="/dashboard/payouts"
          title="Payouts"
          subtitle="Request and track payouts"
        />
      </div>

      {/* Payout rules reminder (existing shared component) */}
      <PayoutNotice />

      {/* Recent Links (placeholder shell to preserve layout) */}
      <section className="rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Your Recent Links</div>
          <Link href="/dashboard/links" className="text-xs text-emerald-700 hover:underline">
            Open Links
          </Link>
        </div>
        <ul className="divide-y">
          {[1, 2, 3].map((i) => (
            <li key={i} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Example Link #{i}</div>
                <div className="text-xs text-gray-600">Clicks: — • Last 24h: —</div>
              </div>
              <Link href="/dashboard/links" className="text-xs underline">
                Manage
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Referral Status (shell) */}
      <section className="rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Referral Status</div>
          <Link href="/dashboard" className="text-xs text-emerald-700 hover:underline">
            How it works
          </Link>
        </div>
        <div className="text-sm text-gray-700">
          Invite 3 people to unlock the 5% bonus window for 90 days.
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Your code (placeholder):{" "}
          <span className="font-mono bg-gray-50 px-1 py-0.5 rounded">abc123</span>
        </div>
      </section>

      {/* Account info */}
      <section className="rounded-xl border p-4">
        <div className="text-sm font-medium mb-2">Account</div>
        <div className="text-xs text-gray-600">
          User ID: <span className="font-mono">{userId}</span>
        </div>
      </section>
    </main>
  );
}

function CardLink({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="rounded-xl border p-4 hover:bg-gray-50 transition">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-gray-600 mt-1">{subtitle}</div>
    </Link>
  );
}
