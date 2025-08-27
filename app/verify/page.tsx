// app/verify/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const token = searchParams.get("token");
    if (!token) {
      // ✅ If user lands here without a token (right after signup), send them to the safe page
      router.replace("/check-email");
      return;
    }

    // ✅ With token: hand off to server which verifies and redirects to /login?verified=1
    window.location.assign(`/api/auth/verify?token=${encodeURIComponent(token)}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow rounded p-6 text-center max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-2">Email Verification</h1>
        <p className="text-gray-600">Verifying your email…</p>
        <div className="mt-4 inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
      </div>
    </div>
  );
}
