"use client";
import dynamic from "next/dynamic";
import LogoutButton from "@/components/dashboard/LogoutButton";

const ReferralLinkCard = dynamic(() => import("./components/ReferralLinkCard"), { ssr: false });

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <LogoutButton />
      </div>
      <ReferralLinkCard />
    </main>
  );
}
