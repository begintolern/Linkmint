"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = { open: boolean; remaining: number; cap: number };

export default function SmartSignupButton() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/signup/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ open: true, remaining: 1, cap: 100 })); // fail-open
  }, []);

  if (!status) {
    return (
      <div className="inline-flex items-center rounded-xl bg-gray-900 px-5 py-3 text-white opacity-80">
        Loading…
      </div>
    );
  }

  if (status.open) {
    return (
      <Link
        href="/signup"
        className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-white font-medium hover:bg-black transition"
      >
        Get started — it’s free
      </Link>
    );
  }

  return (
    <Link
      href="/waitlist"
      className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 font-medium hover:bg-gray-50 transition"
      title="Signups are full — join the waitlist"
    >
      Join the waitlist
    </Link>
  );
}
