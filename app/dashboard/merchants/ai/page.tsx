// app/dashboard/merchants/ai/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import AISuggestionsClient from "../AISuggestionsClient";

export default function MerchantsAISuggestionsPage() {
  return (
    <main className="p-6 space-y-6">
      {/* Back to Smart Links */}
      <div>
        <Link
          href="/dashboard/links"
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs text-gray-800 hover:bg-gray-50"
        >
          ← Back to Smart Links
        </Link>
      </div>

      <DashboardPageHeader
        title="AI Suggestions (beta)"
        subtitle="Heuristic picks for offers and products. Click any card to open, or create a Smart Link directly."
      />

      {/* AI suggestions panel (client) */}
      <AISuggestionsClient />
    </main>
  );
}
