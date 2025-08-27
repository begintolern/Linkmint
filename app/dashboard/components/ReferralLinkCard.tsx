// app/dashboard/components/ReferralLinkCard.tsx
"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function ReferralLinkCard() {
  const auth = typeof useSession === "function" ? useSession() : undefined;
  const session = auth?.data ?? null;
  const codeFromHook = (session?.user as any)?.referralCode as string | undefined;

  const [code, setCode] = useState<string | undefined>(codeFromHook);

  useEffect(() => {
    // update from hook when it changes
    if (codeFromHook && codeFromHook !== code) setCode(codeFromHook);
  }, [codeFromHook]);

  useEffect(() => {
    // fallback: fetch session directly if code still missing
    if (!code) {
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((j) => setCode(j?.user?.referralCode || undefined))
        .catch(() => {});
    }
  }, [code]);

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
      <p className="text-xs text-gray-500 mt-1">Share this link with friends to invite them.</p>
    </div>
  );
}
