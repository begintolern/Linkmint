// app/admin/ops/page.tsx
"use client";

import Link from "next/link";

export default function AdminOpsHealth() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <h1 className="text-lg font-semibold">Admin · Ops &amp; Health</h1>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <p className="text-sm text-gray-600 mb-4">
          Quick links to built-in health checks and diagnostics.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            title="DB Check (admin)"
            desc="Verifies Prisma can connect and run a trivial query."
            href="/api/admin/db-check"
          />
          <Card
            title="Warnings: Manual Scan (admin)"
            desc="Run the manual warnings scan (requires x-admin-key via curl)."
            href="/api/admin/warnings/scan?lookbackHours=24&limit=200"
          />
          <Card
            title="Warnings: Cron Scan (cron)"
            desc="Cron-triggered scan endpoint (requires x-cron-secret via curl)."
            href="/api/cron/warnings/scan?lookbackHours=24&limit=200"
          />
          <Card
            title="Merchant Rules (admin API)"
            desc="Lists recent merchant rules from the database."
            href="/api/admin/merchant-rules"
          />
        </div>

        <div className="mt-6">
          <Link
            href="/admin/warnings"
            className="inline-block rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            View Warnings
          </Link>
        </div>
      </section>
    </main>
  );
}

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
      <div className="mt-3">
        <a
          href={href}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Open
        </a>
      </div>
    </div>
  );
}
