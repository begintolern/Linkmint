"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = useMemo(() => sp.get("token") ?? "", [sp]);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!token) return setErr("Invalid or missing token.");
    if (pw1.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw1 !== pw2) return setErr("Passwords do not match.");

    setBusy(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pw1 }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) {
        setErr(j?.error ?? "Reset failed");
        return;
      }
      setOk(true);
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Reset password</h1>

      {!token ? (
        <p className="text-sm text-red-600">Invalid or missing token.</p>
      ) : ok ? (
        <p className="text-sm text-green-700">Password updated. Redirecting to login…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <label className="block">
            <span className="text-sm">New password</span>
            <input
              type="password"
              required
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="••••••••"
            />
          </label>
          <label className="block">
            <span className="text-sm">Confirm password</span>
            <input
              type="password"
              required
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-60"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </main>
  );
}
