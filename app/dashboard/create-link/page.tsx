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

            {/* Temu rules note (process-only, explicit) */}
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-slate-800">
              <p className="font-semibold text-slate-900">
                Temu links — important
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Temu smart links may open the <strong>Temu homepage</strong>. Item-level links are not required.
                </li>
                <li>
                  Tracking is <strong>cookie-based</strong>. Buyer should click your link first, then browse and buy in the same session.
                </li>
                <li>
                  If multiple items are purchased in the same session, commissions may apply to <strong>all eligible items</strong>.
                </li>
                <li>
                  Buyer and delivery address must be <strong>US-based</strong>.
                </li>
                <li>
                  Refunded or canceled orders do <strong>not</strong> qualify.
                </li>
              </ul>
              <p className="mt-2 text-[10px] text-slate-700">
                Temu controls tracking and approval. linkmint.co cannot override Temu rules.
              </p>
            </div>
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
