// app/verify/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const didRun = useRef(false); // guard Strict Mode double invoke in dev

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    const ctrl = new AbortController();

    // fail fast if the request hangs
    const timeout = setTimeout(() => {
      ctrl.abort();
      setStatus("error");
      setMessage("Verification is taking too long. Please try again.");
    }, 10000);

    (async () => {
      try {
        setStatus("verifying");
        const res = await fetch(`/api/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
          signal: ctrl.signal,
        });

        let data: any = {};
        try {
          data = await res.json();
        } catch {
          /* ignore non-JSON */
        }

        if (res.ok && data?.success) {
          setStatus("success");
          // brief success flash, then redirect to login with banner
          setTimeout(() => router.replace("/login?verified=true"), 600);
        } else {
          setStatus("error");
          setMessage(data?.error || "Verification failed. Your link may be expired.");
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setStatus("error");
          setMessage("Server error while verifying your email. Please try again.");
        }
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      clearTimeout(timeout);
      ctrl.abort();
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-md rounded px-8 py-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>

        {status === "verifying" && (
          <div className="text-gray-700">
            Verifying your email…
            <div className="mt-4 inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          </div>
        )}

        {status === "success" && (
          <div className="text-green-700">Success! Redirecting you to the login page…</div>
        )}

        {status === "error" && (
          <div className="text-red-700">
            {message || "Verification failed."}
            <div className="mt-6">
              <Link href="/login" className="text-blue-600 hover:underline">
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
