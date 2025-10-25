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

  // Rule acknowledgment (required)
  const [rulesAck, setRulesAck] = useState(false);

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
    agreeTerms &&
    rulesAck;

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
    if (!rulesAck) {
      setError("You must acknowledge the earning & payout rules.");
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
          tosAccepted: true,
          rulesAccepted: true, // signal only; no backend change required
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
      setRulesAck(false);
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
          Share smart links, earn commissions. Already have an account{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
          .
        </p>

        {/* Payout methods notice — GCash + PayPal (neutral wording) */}
        <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          💳 Payouts are currently available via{" "}
          <span className="font-semibold">GCash (PHP)</span> and{" "}
          <span className="font-semibold">PayPal (USD)</span>. Other payout methods
          (e.g., Maya/PayMaya, bank transfer) are not supported yet.
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

          {/* Age confirmation */}
          <label className="flex gap-2 items-start text-sm select-none">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>I am 18 years of age or older.</span>
          </label>

          {/* Terms of Service + Privacy Policy */}
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

          {/* Rule acknowledgment */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-700 mb-2 font-medium">
              Earning & payout rules (summary):
            </p>
            <ul className="mb-3 list-disc pl-5 text-xs text-gray-700 space-y-1">
              <li>Payouts only after affiliate funds are received by Linkmint.</li>
              <li>No self-purchase, bot traffic, or spam clicks.</li>
              <li>Unauthorized coupons and gift cards are typically excluded.</li>
              <li>Respect allowed platforms, geo restrictions, and cookie windows.</li>
              <li>Some purchases may be disqualified (reason shown in your dashboard).</li>
            </ul>
            <label className="flex gap-2 items-start text-sm select-none">
              <input
                type="checkbox"
                checked={rulesAck}
                onChange={(e) => setRulesAck(e.target.checked)}
                className="mt-1"
              />
              <span>
                I understand these rules.{" "}
                <Link
                  href="/trust-center"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                >
                  Learn more in the Trust Center
                </Link>{" "}
                or{" "}
                <Link
                  href="/tutorial"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                >
                  see how it works
                </Link>
                .
              </span>
            </label>
          </div>

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
