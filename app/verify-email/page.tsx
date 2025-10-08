"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyEmailHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token") ?? "";

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        const res = await fetch(`/api/verify-email?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setTimeout(() => {
            router.push("/login?verified=true");
          }, 3000);
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Verification failed:", err);
        setStatus("error");
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md max-w-md w-full text-center">
        {status === "verifying" && (
          <p className="text-gray-700">Verifying your email...</p>
        )}
        {status === "success" && (
          <p className="text-green-600 font-semibold">
            ✅ Email verified successfully! Redirecting to login...
          </p>
        )}
        {status === "error" && (
          <p className="text-red-600 font-semibold">
            ❌ Invalid or expired verification link.
          </p>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-600 text-sm">Loading…</div>}>
      <VerifyEmailHandler />
    </Suspense>
  );
}
