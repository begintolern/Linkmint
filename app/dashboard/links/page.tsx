// app/dashboard/links/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import RecentLinksClient from "@/components/RecentLinksClient";
import LinksToolbar from "./LinksToolbar";

export default async function LinksPage() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard/links");
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Top bar: title/subtitle left, all actions right */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your Recent Links</h2>
          <p className="text-sm text-muted-foreground">
            Click a link to copy, open, or view stats.
          </p>
        </div>
        <LinksToolbar />
      </div>

      {/* Unified recent list; its own toolbar is hidden to avoid duplication */}
      <RecentLinksClient />
    </main>
  );
}
