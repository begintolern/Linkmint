// app/dashboard/create-link/page.tsx
import Link from "next/link";
import CreateLinkClient from "./CreateLinkClient";
import CompactRecent from "./CompactRecent";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function CreateLinkPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
              Create smart link
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Paste a product URL, choose where you&apos;ll share it, and we&apos;ll
              generate a tracked link.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="text-xs sm:text-sm text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>

        {/* Main layout */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1.4fr)]">
          {/* Left: create form */}
          <section className="card">
            <CreateLinkClient />
          </section>

          {/* Right: recent links */}
          <aside className="card bg-slate-50/60">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              Your recent links
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Latest smart links you&apos;ve created, including Lazada, Shopee, Zalora and others.
            </p>
            <div className="max-h-80 overflow-y-auto pr-1">
              <CompactRecent />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
