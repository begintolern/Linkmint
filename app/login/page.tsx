// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Messages from query string (e.g., after email verification)
  useEffect(() => {
    if (searchParams?.get("verified") === "true") {
      setInfoMsg("Your email is verified. You can sign in now.");
    }

    const nextAuthErr = searchParams?.get("error");
    if (nextAuthErr === "EMAIL_NOT_VERIFIED") {
      setErrorMsg("Please verify your email before signing in.");
    } else if (nextAuthErr) {
      setErrorMsg("Invalid email or password.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/dashboard",
      });

      if (res?.ok) {
        router.push(res.url ?? "/dashboard");
        return;
      }

      // Specific handling for our thrown error
      if (res?.error === "EMAIL_NOT_VERIFIED") {
        setErrorMsg("Please verify your email before signing in.");
      } else {
        setErrorMsg(res?.error ?? "Invalid email or password.");
      }
    } catch {
      setErrorMsg("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded px-8 py-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        {infoMsg && (
          <div
            className="mb-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700"
            role="status"
          >
            {infoMsg}
          </div>
        )}

        {errorMsg && (
          <div
            className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black text-white py-2 font-medium disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
