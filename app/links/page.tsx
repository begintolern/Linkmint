// app/links/page.tsx
import LinksTable from "@/components/links/LinksTable";
import SmartLinkGenerator from "@/components/dashboard/SmartLinkGenerator";

export default function LinksPage() {
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Your Links</h1>

      {/* Smart Link generator */}
      <SmartLinkGenerator />

      {/* Links table */}
      <LinksTable />
    </main>
  );
}
