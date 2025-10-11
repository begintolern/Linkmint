// app/logout/page.tsx
"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    // End session then send user to /login
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <main className="mx-auto max-w-sm p-6">
      <p>Signing you out…</p>
    </main>
  );
}
