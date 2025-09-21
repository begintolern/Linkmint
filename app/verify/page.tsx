// app/verify/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const params = useSearchParams();
  const token = params?.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("Verifying your email…");

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (res.ok && data?.ok) {
          setStatus("ok");
          setMessage("Your email has been verified. You can log in now.");
        } else {
          setStatus("error");
          setMessage(data?.message || "Invalid or expired token.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }
    run();
  }, [token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold">Email verification</h1>
      <p className={`mt-3 text-sm ${status === "error" ? "text-red-600" : "text-gray-700"}`}>
        {message}
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-black transition"
        >
          Go to login
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 transition"
        >
          Back to home
        </Link>
      </div>

      {status === "error" && (
        <p className="mt-4 text-xs text-gray-500">
          Tip: If your link expired, you can{" "}
          <Link href="/login" className="underline">
            request a new verification email
          </Link>
          .
        </p>
      )}
    </main>
  );
}
