// app/dashboard/links/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";

import Link from "next/link";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import RecentLinksClient from "@/app/components/RecentLinksClient";

type AppUser = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
};

export default async function SmartLinksPage() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard/links");
  }

  const user = (session?.user ?? {}) as AppUser;
  const name = user?.email ? user.email.split("@")[0] : user?.name ?? "there";

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <DashboardPageHeader
        title="Smart Links"
        subtitle={`Create and manage links · Welcome back, ${name}`}
      />

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/dashboard/create-link"
          className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Create Smart Link
        </Link>

        <Link
          href="/dashboard/merchants"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Explore Merchants
        </Link>

        <Link
          href="/dashboard/merchants/ai"
          className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          AI Suggestions (beta)
        </Link>
      </div>

      {/* Recent Links List (demo/localStorage) */}
      <RecentLinksClient />
    </main>
  );
}
