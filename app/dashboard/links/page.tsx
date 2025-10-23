// app/dashboard/links/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";

import Link from "next/link";
import DashboardPageHeader from "@/components/DashboardPageHeader";

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

      {/* Primary actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
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
      </div>

      {/* (Optional) recent links placeholder – safe to keep empty for now */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5">
        <h2 className="text-base font-medium sm:text-lg">Your recent links</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your last created links will appear here. Create one to get started.
        </p>
      </section>
    </main>
  );
}
