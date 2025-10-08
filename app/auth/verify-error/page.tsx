export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VerifyErrorPage() {
  const q = useSearchParams();
  const reason = q?.get("reason") ?? "";
  const initialEmail = q?.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    setStatus(null);
    try {
      const r = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      setStatus({ ok: r.ok, msg: j?.message ?? (r.ok ? "Email sent." : "Failed to send.") });
    } catch (e: any) {
      setStatus({ ok: false, msg: e?.message ?? "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">Verification issue</h1>
      {reason ? (
        <p className="text-sm text-gray-600">Reason: {reason}</p>
      ) : (
        <p className="text-sm text-gray-600">We couldn’t verify your sign-in link.</p>
      )}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Resend link to</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border px-3 py-2"
        />
        <button
          onClick={resend}
          disabled={loading || !email}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Sending…" : "Resend verification email"}
        </button>
        {status && (
          <p className={`text-sm ${status.ok ? "text-green-600" : "text-red-600"}`}>{status.msg}</p>
        )}
      </div>
    </main>
  );
}
