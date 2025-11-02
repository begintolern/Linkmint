// app/dashboard/links/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import Link from "next/link";
import RecentLinksClient from "@/components/RecentLinksClient";

export default async function LinksPage() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard/links");
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold">Manage Links (Advanced)</h2>
      <p className="text-sm text-muted-foreground">
        View or manage your previously created smart links. Use <b>Create Smart Link</b> for quick sharing.
      </p>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/create-link"
          className="rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-emerald-50 border-emerald-200 text-emerald-700"
          aria-label="Create Smart Link"
        >
          Create Smart Link
        </Link>
        <Link
          href="/dashboard/merchants"
          className="rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-blue-50 border-blue-200 text-blue-700"
          aria-label="Explore Merchants"
        >
          Explore Merchants
        </Link>
        <Link
          href="/dashboard/merchants/ai"
          className="rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-purple-50 border-purple-200 text-purple-700"
          aria-label="AI Suggestions (beta)"
        >
          AI Suggestions (beta)
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 border-gray-200 text-gray-700"
          aria-label="Back to Dashboard"
        >
          Dashboard
        </Link>
      </div>

      {/* Advanced list */}
      <RecentLinksClient />
    </main>
  );
}
