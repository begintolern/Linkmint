export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import CreateLinkClient from "./CreateLinkClient";
import RecentLinksClient from "@/components/RecentLinksClient";

export default async function CreateLinkPage() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard/create-link");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Create Smart Link</h1>
        <p className="text-sm opacity-80">
          Paste a Lazada/Shopee URL, create, then copy/share below.
        </p>
      </header>

      {/* Form: actual Smart Link creation */}
      <CreateLinkClient />

      <hr className="my-4 border-gray-200" />

      {/* Full interactive recent links list */}
      <RecentLinksClient />
    </main>
  );
}
