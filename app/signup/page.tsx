"use client";

import React, { useState } from "react";
import Link from "next/link";

type SignupResponse = {
  ok: boolean;
  message?: string;
};

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit =
    !loading &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === confirm &&
    ageConfirmed &&
    agreeTerms;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!ageConfirmed) {
      setError("You must confirm you are 18+.");
      return;
    }
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          ageConfirmed: true,
          // Important: pass through for server-side enforcement/logging
          tosAccepted: true,
        }),
      });

      const data: SignupResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Signup failed. Please try again.");
      }

      setSuccess(
        "Account created! Please check your email to verify before logging in."
      );
      setName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setAgeConfirmed(false);
      setAgreeTerms(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl shadow-lg p-6 md:p-8 bg-white">
        <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
        <p className="text-sm text-gray-600 mb-6">
          Share smart links, earn commissions. Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
          .
        </p>

        {/* PayPal-only payout disclaimer */}
        <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          💳 Payouts are currently available via{" "}
          <span className="font-semibold">PayPal (USD)</span> only. Other payout
          methods (e.g., GCash, Maya/PayMaya, bank transfer) are not supported yet.
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          {/* Age confirmation (existing policy) */}
          <label className="flex gap-2 items-start text-sm select-none">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>I am 18 years of age or older.</span>
          </label>

          {/* Terms of Service + Privacy Policy agreement */}
          <label className="flex gap-2 items-start text-sm select-none">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded-lg px-4 py-2 font-medium text-white ${
              canSubmit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-xs text-gray-500 mt-2">
            By creating an account, you acknowledge Linkmint’s payout rules:
            commissions are paid only after affiliate networks mark them
            <strong> Approved</strong> and funds are received by Linkmint.
          </p>
        </form>
      </div>
    </div>
  );
}
