// app/dashboard/referrals/page.tsx
import { getServerSession } from "next-auth/next"; // ✅ correct import for NextAuth v4
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";

export default async function ReferralsDashboardPage() {
  const session = await getServerSession(authOptions);

  // If not logged in → send to login, then back here
  if (!session) {
    redirect("/login?next=/dashboard/referrals");
  }

  // 🔻 KEEP everything you already had below, unchanged
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {/* ---- Your existing referral dashboard starts here ---- */}

      {/* Example: if you had components like these, leave them as-is */}
      {/* <ReferralSummary /> */}
      {/* <ReferralInviteLink /> */}
      {/* <ReferralBonuses /> */}
      {/* <ReferralTable /> */}
      {/* <ReferralFaq /> */}

      {/* ---- End of your existing referral dashboard ---- */}
    </main>
  );
}
