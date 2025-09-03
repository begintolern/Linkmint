"use client";

import { useEffect } from "react";

export default function FallbackAttach() {
  useEffect(() => {
    async function attach() {
      try {
        const res = await fetch("/api/referrals/default-fallback", {
          cache: "no-store",
        });
        const j = await res.json();
        if (j.ok && j.attached) {
          console.log(`[Fallback] User attached to founder: ${j.inviter}`);
        }
      } catch (err) {
        console.error("[Fallback attach] failed", err);
      }
    }
    attach();
  }, []);

  return null;
}
