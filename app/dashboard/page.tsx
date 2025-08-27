"use client";

import dynamic from "next/dynamic";
const ReferralLinkCard = dynamic(() => import("./components/ReferralLinkCard"), { ssr: false });

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <ReferralLinkCard />
    </main>
  );
}
