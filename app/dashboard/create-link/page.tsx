// app/dashboard/create-link/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import CreateLinkClient from "./CreateLinkClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <CreateLinkClient />
    </Suspense>
  );
}
