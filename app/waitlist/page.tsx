// app/waitlist/page.tsx
"use client";

import { useState } from "react";

type State = "idle" | "ok" | "err";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;

    setBusy(true);
    setState("idle");
    setMsg(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "cap-closed" }),
      });

      if (res.ok) {
        setState("ok");
        setMsg("You’re on the list! We’ll email you when spots open.");
        setEmail("");
      } else {
        let text = "Something went wrong. Please try again.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error === "invalid_email") text = "Please enter a valid email.";
        } catch {}
        setState("err");
        setMsg(text);
      }
    } catch {
      setState("err");
      setMsg("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Join the Waitlist</h1>
        <p className="mt-3 text-gray-600">
          We’re currently at capacity. Drop your email and we’ll notify you as soon as a spot opens.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex gap-2">
        <input
          type="email"
          required
          inputMode="email"
          placeholder="you@example.com"
          className="flex-1 rounded-xl border px-4 py-3 outline-none focus:border-gray-800"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-gray-900 px-5 py-3 text-white disabled:opacity-60"
        >
          {busy ? "Adding..." : "Notify me"}
        </button>
      </form>

      {state === "ok" && <p className="mt-4 text-sm text-green-600">{msg}</p>}
      {state === "err" && <p className="mt-4 text-sm text-red-600">{msg}</p>}

      <div className="mt-8 text-xs text-gray-500 text-center">
        No spam. We’ll only email you about your spot.
      </div>
    </div>
  );
}
