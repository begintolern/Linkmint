// app/login/page.tsx
"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginForm() {
  const sp = useSearchParams();
  const router = useRouter();

  const next = sp?.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,   // NextAuth still sets cookie; we handle navigation
      callbackUrl: next,
    });

    setBusy(false);

    if (!res) {
      setErr("No response from server.");
      return;
    }
    if (res.error) {
      setErr(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error);
      return;
    }
    router.push(res.url ?? next);
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-xl font-semibold">Log in</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Log in"}
        </button>
      </form>

      {err && <p className="text-sm text-red-600">{err}</p>}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-sm p-6">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
