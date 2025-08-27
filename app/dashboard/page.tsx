"use client";

import ReferralLinkCard from "./components/ReferralLinkCard";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <ReferralLinkCard />
      {/* your existing dashboard sections here */}
    </main>
  );
}
