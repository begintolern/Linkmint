// app/dashboard/opportunities/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import DashboardPageHeader from "@/components/DashboardPageHeader";

export default function OpportunitiesPage() {
  return (
    <main>
      <DashboardPageHeader
        title="AI Opportunities"
        subtitle="Discover trending offers powered by AI insights."
      />

      <section className="rounded-2xl border p-6 space-y-3">
        <p className="text-sm text-gray-700">
          🚀 This section will highlight trending merchants, offers, or categories
          suggested by AI. It’s designed to help you maximize commissions by
          focusing on what’s hot right now.
        </p>
        <p className="text-sm text-gray-600">
          For now, this is a placeholder. Soon, it will pull real insights from
          merchant feeds and usage patterns.
        </p>
      </section>
    </main>
  );
}
