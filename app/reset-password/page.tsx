export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// app/reset-password/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params?.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function submit() {
    if (!token) {
      setMsg({ ok: false, text: "Missing or invalid reset token." });
      return;
    }
    if (!password || password !== confirm) {
      setMsg({ ok: false, text: "Passwords do not match." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const j = await r.json();
      setMsg({
        ok: r.ok,
        text: j?.message ?? (r.ok ? "Password updated." : "Reset failed."),
      });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">Reset password</h1>
      {!token && (
        <p className="text-sm text-red-600">
          No token found in the URL. Please use the link from your email.
        </p>
      )}
      <div className="space-y-2">
        <label className="block text-sm font-medium">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
        <label className="block text-sm font-medium">
          Confirm new password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
        <button
          onClick={submit}
          disabled={busy || !token}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
        {msg && (
          <p
            className={`text-sm ${
              msg.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </main>
  );
}
