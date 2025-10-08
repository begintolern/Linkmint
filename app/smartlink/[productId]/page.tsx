// app/smartlink/[productId]/page.tsx
"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SmartlinkRedirectPage() {
  return (
    <Suspense fallback={<p className="p-6 text-slate-600 text-sm">Redirecting…</p>}>
      <SmartlinkInner />
    </Suspense>
  );
}

function SmartlinkInner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const ref = sp?.get("ref");
    if (ref) {
      // 30 days
      document.cookie = `linkmint_ref=${ref}; path=/; max-age=${30 * 24 * 60 * 60}`;
    }
    // Simulate redirect to purchase/thank-you page
    router.replace("/thank-you");
  }, [sp, router]);

  return <p>Redirecting to product...</p>;
}
