// app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp?.get("next") || "/dashboard";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,     // NextAuth still sets cookie; we handle navigation
      callbackUrl: next,
    });

    setBusy(false);

    if (!res) return setErr("No response from server.");
    if (res.error) return setErr(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error);

    router.push(res.url ?? next);
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-xl font-semibold">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-md border px-3 py-2" required />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-md border px-3 py-2" required />
        <button disabled={busy} className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60">
          {busy ? "Signing in…" : "Log in"}
        </button>
      </form>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </main>
  );
}
