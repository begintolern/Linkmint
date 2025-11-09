// app/dashboard/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

type WhoAmI =
  | {
      ok: true;
      user?: { id?: string | null; email?: string | null; name?: string | null; role?: string | null } | null;
      // some builds of /api/whoami return top-level fields instead of user{}
      id?: string | null;
      email?: string | null;
    }
  | { ok: false; error: string };

export default function Page() {
  const [me, setMe] = useState<WhoAmI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch("/api/whoami", { cache: "no-store" });
        const data = (await res.json()) as WhoAmI;
        if (!abort) setMe(data);
      } catch {
        if (!abort) setMe({ ok: false, error: "NETWORK" } as any);
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
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-2">Loading…</p>
      </main>
    );
  }

  if (!me || !("ok" in me) || !me.ok) {
    return (
      <main className="max-w-6xl mx-auto p-6">
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

  // Support both shapes:
  const userId = me.user?.id ?? (me as any).id ?? null;
  const email = me.user?.email ?? (me as any).email ?? null;

  if (!userId) {
    return (
      <main className="max-w-6xl mx-auto p-6">
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

  // >>> This renders your 6 colored cards via DashboardClient
  return <DashboardClient userId={userId} email={email} />;
}
