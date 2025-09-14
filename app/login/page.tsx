// app/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.message || "Login failed.");
          return;
        }
        // Redirect or refresh
        window.location.href = "/dashboard";
      } catch {
        setMessage("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-2 text-sm text-gray-600">
        Don’t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-gray-900 py-2 text-white hover:bg-black transition"
        >
          {isPending ? "Logging in..." : "Log in"}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}

      {/* Resend verification form */}
      <ResendVerification />
    </main>
  );
}

function ResendVerification() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setMessage(data.message || "Check your inbox.");
      } catch {
        setMessage("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="mt-10 border-t pt-6">
      <h2 className="text-sm font-medium text-gray-700">
        Didn’t get your verification email?
      </h2>
      <form onSubmit={handleResend} className="mt-3 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-gray-900 py-2 text-white hover:bg-black transition"
        >
          {isPending ? "Sending..." : "Resend verification email"}
        </button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </form>
    </div>
  );
}
