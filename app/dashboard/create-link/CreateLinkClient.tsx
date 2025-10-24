// app/dashboard/create-link/CreateLinkClient.tsx
"use client";

export const revalidate = 0;

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function CreateLinkClient() {
  // Safe in client; page.tsx provides the Suspense boundary
  const searchParams = useSearchParams();
  const initialUrl = useMemo(() => searchParams?.get("url") || "", [searchParams]);
  const [url, setUrl] = useState<string>(initialUrl);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  return (
    <div className="p-6 space-y-6">
      {/* Back to Smart Links */}
      <div>
        <Link
          href="/dashboard/links"
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs text-gray-800 hover:bg-gray-50"
        >
          ← Back to Smart Links
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Create Smart Link</h1>
        <p className="mt-2 text-sm text-gray-600">
          Paste a product URL or choose a merchant to generate a tracked, compliant link.
        </p>
      </div>

      <div className="max-w-xl border rounded-2xl p-4 shadow-sm bg-white">
        <label className="block text-sm font-medium mb-1">Product URL</label>
        <input
          type="url"
          placeholder="https://example.com/product/123"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <textarea
          placeholder="Campaign notes…"
          className="w-full rounded-lg border px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={4}
        />

        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Generate Link
        </button>
      </div>
    </div>
  );
}
