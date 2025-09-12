// app/dashboard/links/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import Link from "next/link";
import LogoutButton from "@/components/dashboard/LogoutButton";

// Keep merchant search on this page
import MerchantSearchSection from "@/components/search/MerchantSearchSection";

// Your existing one-button generator + history
import SmartLinkGenerator from "@/components/dashboard/SmartLinkGenerator";

export default async function SmartLinksPage() {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  const name = session?.user?.name ?? "";

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Smart Links</h1>
          {name ? <p className="text-sm text-gray-500 mt-1">Hi, {name}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-4"
          >
            ← Back to Overview
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Find merchants (with Visit Merchant only) */}
      <MerchantSearchSection />

      {/* Single-button Smart Link generator + history */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Create Smart Link</h2>
        <SmartLinkGenerator />
      </section>
    </main>
  );
}
