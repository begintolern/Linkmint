// app/smartlink/[productId]/page.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SmartlinkRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ref = searchParams?.get("ref") ?? null;

  useEffect(() => {
    const referrerId = searchParams?.get("ref") ?? null;

    if (referrerId) {
      // Set a cookie for 30 days
      document.cookie = `linkmint_ref=${referrerId}; path=/; max-age=${30 * 24 * 60 * 60}`;
    }

    // Simulate redirect to purchase page
    router.replace("/thank-you");
  }, [router, ref]);

  return <p>Redirecting to product...</p>;
}
