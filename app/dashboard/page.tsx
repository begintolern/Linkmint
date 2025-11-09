// app/dashboard/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { useEffect, useState } from "react";
import Link from "next/link";

type WhoAmI =
  | {
      ok: true;
      user: { id?: string | null; email?: string | null; name?: string | null; role?: string | null };
    }
  | { ok: false; error: string };

export default function DashboardPage() {
  const [me, setMe] = useState<WhoAmI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch("/api/whoami", { cache: "no-store" });
        const data = (await res.json()) as WhoAmI;
        if (!abort) setMe(data);
      } catch (e) {
        if (!abort) setMe({ ok: false, error: "NETWORK" });
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-2">Loading…</p>
      </main>
    );
  }

  if (!me || !me.ok || !me.user?.id) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="mt-4 rounded-lg border p-4 bg-yellow-50 text-yellow-800">
          You’re not signed in. Please{" "}
          <Link href="/login" className="underline">
            log in
          </Link>{" "}
          to access your dashboard.
        </div>
      </main>
    );
  }

  const userId = me.user.id!;
  const email = me.user.email || "—";

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="text-sm text-gray-600">
          <span className="font-mono">{email}</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          href="/dashboard/create-link"
          className="rounded-xl border p-4 hover:bg-gray-50"
        >
          <div className="text-sm font-medium">Create SmartLink</div>
          <div className="text-xs text-gray-600 mt-1">Make a new link to share</div>
        </Link>

        <Link
          href="/dashboard/links"
          className="rounded-xl border p-4 hover:bg-gray-50"
        >
          <div className="text-sm font-medium">Your Links</div>
          <div className="text-xs text-gray-600 mt-1">View and manage links</div>
        </Link>

        <Link
          href={`/dashboard/payouts`}
          className="rounded-xl border p-4 hover:bg-gray-50"
        >
          <div className="text-sm font-medium">Payouts</div>
          <div className="text-xs text-gray-600 mt-1">Request and track payouts</div>
        </Link>
      </div>

      {/* Example of guarded usage */}
      <section className="rounded-xl border p-4">
        <div className="text-sm font-medium mb-2">Account</div>
        <div className="text-xs text-gray-600">
          User ID: <span className="font-mono">{userId}</span>
        </div>
      </section>
    </main>
  );
}
