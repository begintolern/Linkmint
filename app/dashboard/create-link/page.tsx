// app/dashboard/create-link/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function CreateLinkPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Create Smart Link</h1>
      <p className="text-sm text-gray-600">
        Paste a product URL or choose a merchant to generate a tracked, compliant link.
      </p>

      {/* Placeholder form (you can wire this up later) */}
      <div className="max-w-xl border rounded-2xl p-4 shadow-sm">
        <label className="block text-sm font-medium mb-1">Product URL</label>
        <input
          type="url"
          placeholder="https://example.com/product/123"
          className="w-full rounded-lg border px-3 py-2 mb-3"
        />

        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <textarea
          placeholder="Campaign notes…"
          className="w-full rounded-lg border px-3 py-2 mb-4"
          rows={4}
        />

        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Generate Link
        </button>
      </div>
    </div>
  );
}
