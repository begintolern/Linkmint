// app/dashboard/links/create/page.tsx
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

export default async function CreateSmartLinkPage() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard/links/create");
  }

  const user = (session?.user ?? {}) as AppUser;
  const name = user?.email ? user.email.split("@")[0] : user?.name ?? "there";

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Top-left back link to Smart Links */}
      <div>
        <Link
          href="/dashboard/links"
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs text-gray-800 hover:bg-gray-50"
        >
          ← Back to Smart Links
        </Link>
      </div>

      <DashboardPageHeader
        title="Create Smart Link"
        subtitle={`Set up a trackable link · Welcome, ${name}`}
      />

      {/* ===== Your create-link UI / form goes here =====
          If you already have a form component, render it here, e.g.:
          <CreateSmartLinkForm />
      */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5">
        <h2 className="text-base font-medium sm:text-lg">Smart Link builder</h2>
        <p className="mt-2 text-sm text-gray-600">
          Paste a product or merchant URL to generate a trackable Smart Link. You can also browse
          approved programs via Explore Merchants from the Smart Links page.
        </p>
      </section>
    </main>
  );
}
