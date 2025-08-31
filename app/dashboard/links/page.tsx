// app/dashboard/links/page.tsx
import SmartLinkGenerator from "@/components/dashboard/SmartLinkGenerator";
import LinksTable from "@/components/links/LinksTable";

export default function DashboardLinksPage() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Smart Links</h1>
        <p className="text-sm text-gray-600">Create and manage your tracking links.</p>
      </header>

      {/* Create new link */}
      <SmartLinkGenerator />

      {/* Recent links */}
      <LinksTable />
    </main>
  );
}
