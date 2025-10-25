// app/dashboard/create-link/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { Suspense } from "react";
import CreateLinkClient from "./CreateLinkClient";

export default function CreateLinkPage() {
  return (
    <div className="p-6 space-y-4">
      <Suspense fallback={<p className="text-sm text-gray-500">Loading form…</p>}>
        <CreateLinkClient />
      </Suspense>
    </div>
  );
}
