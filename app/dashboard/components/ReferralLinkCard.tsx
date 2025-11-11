// app/dashboard/components/ReferralLinkCard.tsx
"use client";

import { useEffect, useState } from "react";

type SessionLite = {
  user?: { referralCode?: string | null } | null;
};

export default function ReferralLinkCard() {
  const [code, setCode] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("session fetch failed");
        const j = (await res.json()) as SessionLite | null;
        const c = j?.user?.referralCode ?? null;
        if (isMounted) setCode(c);
      } catch {
        if (isMounted) setCode(null);
      } finally {
        if (isMounted) setLoaded(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loaded || !code) return null; // render nothing if user has no code yet

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
