// app/dashboard/components/ReferralLinkCard.tsx
"use client";
import { useSession } from "next-auth/react";

export default function ReferralLinkCard() {
  // Be defensive: don't destructure directly
  const sessionResult = typeof useSession === "function" ? useSession() : undefined;
  const session = sessionResult?.data ?? null;

  const code = (session?.user as any)?.referralCode as string | undefined;
  if (!code) return null;

  const link = `https://linkmint.co/signup?ref=${code}`;

  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">Your Referral Link</h2>
      <input
        type="text"
        readOnly
        value={link}
        className="w-full border rounded p-2 text-sm"
        onClick={(e) => (e.target as HTMLInputElement).select()}
      />
      <p className="text-xs text-gray-500 mt-1">
        Share this link with friends to invite them.
      </p>
    </div>
  );
}
