"use client";

import { useEffect, useState } from "react";

export default function AttachReferralOnload() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch("/api/attribution/attach-referral", { method: "POST" });
      } catch {}
      if (!cancelled) setDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
