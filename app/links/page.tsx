import SmartLinkGenerator from "@/components/dashboard/SmartLinkGenerator";
import LinksTable from "@/components/links/LinksTable"; // ← add this

export default function LinksPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Your Links</h1>
        <p className="text-sm text-gray-600">Create and manage your smart links.</p>
      </div>

      {/* Create new link */}
      <SmartLinkGenerator />

      {/* Recent links */}
      <LinksTable />
    </div>
  );
}
