// app/dashboard/referrals/page.tsx
import ReferralSummaryCard from "@/components/dashboard/ReferralSummaryCard";
import ReferralStatusCard from "@/components/dashboard/ReferralStatusCard";
import ReferralCardWrapper from "@/components/dashboard/ReferralCardWrapper";
import ReferralLinkSection from "@/components/ReferralLinkSection";

export default function DashboardReferralsPage() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Referrals</h1>
        <p className="text-sm text-gray-600">
          Share your invite, track batches, and see bonus status.
        </p>
      </header>

      {/* Share / invite tools */}
      <ReferralLinkSection />

      {/* Key referral stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReferralSummaryCard />
        <ReferralStatusCard />
      </div>

      {/* Additional referral details / lists */}
      <ReferralCardWrapper />
    </main>
  );
}
