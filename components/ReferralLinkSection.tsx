// components/ReferralLinkSection.tsx
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import ReferralLinkButton from "@/components/ReferralLinkButton";

export default async function ReferralLinkSection() {
  // Typed session to avoid TS "user does not exist" errors
  const rawSession = await getServerSession(authOptions);
  const session = rawSession as Session | null;

  const email = session?.user?.email ?? null;
  const sessionUserId = (session?.user as any)?.id as string | undefined;

  if (!email) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Please sign in to see your referral link.
      </div>
    );
  }

  // Prefer lookup by id (if your session includes it), else by email
  const me =
    (sessionUserId &&
      (await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { referralCode: true },
      }))) ||
    (await prisma.user.findUnique({
      where: { email },
      select: { referralCode: true },
    }));

  const referralCode = me?.referralCode ?? undefined;

  if (!referralCode) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        No referral code found on your account yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold mb-2">Your referral link</h3>
      <ReferralLinkButton
        referralCode={referralCode}
        // baseUrl={process.env.NEXT_PUBLIC_APP_URL} // optional override
        style="path" // change to "query" if you prefer ?ref=CODE
      />
      <p className="mt-2 text-xs text-gray-500">
        Share this link to earn from referral purchases.
      </p>
    </div>
  );
}
