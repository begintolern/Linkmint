// app/smartlink/[productId]/page.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SmartlinkRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const referrerId = searchParams.get("ref");

    if (referrerId) {
      // Set a cookie for 30 days
      document.cookie = `linkmint_ref=${referrerId}; path=/; max-age=${30 * 24 * 60 * 60}`;
    }

    // Simulate redirect to purchase page
    router.replace("/thank-you");
  }, [searchParams, router]);

  return <p>Redirecting to product...</p>;
}
