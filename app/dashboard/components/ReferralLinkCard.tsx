// app/dashboard/components/ReferralLinkCard.tsx
"use client";
import { useSession } from "next-auth/react";

export default function ReferralLinkCard() {
  const { data: session } = useSession();
  const code = (session?.user as any)?.referralCode;
  const link = code ? `https://linkmint.co/signup?ref=${code}` : null;

  if (!link) return null;

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
