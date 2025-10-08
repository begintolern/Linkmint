"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// app/auth/verify-error/page.tsx
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VerifyErrorPage() {
  const q = useSearchParams();
  const reason =
    q?.get("reason") ||
    "Verification failed or the link has expired. Please request a new one.";

  const [resending, setResending] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function resend() {
    setResending(true);
    setMsg(null);
    try {
      const r = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await r.json().catch(() => ({} as any));
      setMsg({
        ok: r.ok,
        text:
          j?.message ||
          (r.ok
            ? "Verification email sent. Check your inbox."
            : "Could not resend verification email."),
      });
    } catch {
      setMsg({ ok: false, text: "Network error. Try again." });
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">Verification error</h1>
      <p className="text-sm text-gray-600">{reason}</p>

      <div className="space-y-2">
        <button
          onClick={resend}
          disabled={resending}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </div>

      <div className="text-sm">
        <a href="/verify-sent" className="text-teal-700 hover:underline">
          Didn’t get it? Check status
        </a>
      </div>
    </main>
  );
}
