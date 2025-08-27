"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VerifyErrorPage() {
  const q = useSearchParams();
  const reason = q.get("reason");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [loading, setLoading] = useState(false);

  const message =
    reason === "expired"
      ? "Your verification link has expired."
      : reason === "invalid"
      ? "This verification link is invalid or already used."
      : reason === "missing"
      ? "Verification link is missing."
      : "We couldn’t verify your link.";

  async function resend() {
    if (!email) {
      setStatus({ ok: false, msg: "Please enter your email." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data?.success) {
        setStatus({ ok: true, msg: "Verification email sent. Check your inbox." });
      } else {
        setStatus({ ok: false, msg: data?.error || "Could not send email." });
      }
    } catch {
      setStatus({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8">
        <div className="text-2xl font-semibold">Verification issue</div>
        <p className="mt-3 text-slate-600">{message}</p>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">
            Resend verification
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={resend}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Resend"}
            </button>
          </div>
          {status && (
            <p
              className={`mt-3 text-sm ${
                status.ok ? "text-green-600" : "text-red-600"
              }`}
            >
              {status.msg}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
