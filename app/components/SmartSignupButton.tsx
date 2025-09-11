// app/components/SmartSignupButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StatusPayload = {
  open: boolean;
  remaining: number;
  cap: number;
};

export default function SmartSignupButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const res = await fetch("/api/signup/status", { cache: "no-store" });
      const data = (await res.json()) as Partial<StatusPayload>;

      if (data?.open) {
        router.push("/signup");
      } else {
        router.push("/waitlist");
      }
    } catch {
      // Safe fallback: if status fails, send to waitlist
      router.push("/waitlist");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="rounded-xl bg-gray-900 px-5 py-3 text-white disabled:opacity-60"
    >
      {busy ? "Please wait…" : "Get started — it’s free"}
    </button>
  );
}
