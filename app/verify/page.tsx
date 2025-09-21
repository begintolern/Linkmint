// app/verify/page.tsx
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();

  // Use optional chaining so TS doesn't complain about null
  const reason =
    useSearchParams()?.get("reason") as
      | "invalid"
      | "expired"
      | "missing"
      | "error"
      | null;

  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const headline =
    reason === "expired"
      ? "Your verification link has expired"
      : reason === "invalid"
      ? "This verification link is no longer valid"
      : reason === "missing"
      ? "No verification token provided"
      : reason === "error"
      ? "We hit a verification error"
      : "Verify your email";

  const explanation =
    reason === "expired"
      ? "For security, verification links expire after a short time."
      : reason === "invalid"
      ? "This can happen if the link was already used or if a newer link was sent."
      : reason === "missing"
      ? "We couldn’t find a verification token in the URL."
      : reason === "error"
      ? "Something went wrong while verifying your email."
      : "Check your inbox and click the button in the email we sent you.";

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          email ? { email } : {} // allow sending with explicit email, or fall back to server session if supported
        ),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(
          data?.message ||
            "We couldn’t send a new verification email. Please try again."
        );
      } else {
        setMessage(
          data?.message ||
            "Verification email sent. Please check your inbox (and spam)."
        );
      }
    } catch {
      setError("Network issue while resending. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function goToLogin() {
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-2">{headline}</h1>
      <p className="text-sm text-gray-600 mb-6">{explanation}</p>

      {/* Info box */}
      <div className="rounded-2xl border border-gray-200 p-4 mb-6">
        <p className="text-sm text-gray-800">
          Only the <strong>latest</strong> verification email will work. If you
          requested multiple times, please use the most recent email.
        </p>
      </div>

      {/* Resend form */}
      <form onSubmit={handleResend} className="space-y-4">
        <label className="block text-sm font-medium">
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-teal-700 px-4 py-2 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Resend verification email"}
        </button>
      </form>

      {message && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={goToLogin}
          className="text-sm text-teal-700 hover:underline"
        >
          Return to login
        </button>
      </div>
    </div>
  );
}
