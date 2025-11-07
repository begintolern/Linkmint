// app/logout/page.tsx
"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    // End session and redirect user to the landing page
    signOut({ callbackUrl: "/", redirect: true });
  }, []);

  return (
    <main className="min-h-[60vh] grid place-items-center bg-white text-gray-800">
      <div className="text-center space-y-2">
        <p className="text-sm">Signing you out…</p>
        <p className="text-xs text-gray-500">
          You’ll be redirected to the home page shortly.
        </p>
      </div>
    </main>
  );
}
