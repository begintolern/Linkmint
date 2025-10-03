// app/dashboard/settings/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardPageHeader from "@/components/DashboardPageHeader";

type UserResponse =
  | {
      ok: true;
      user: {
        id: string;
        email: string;
        name?: string | null;
        paypalEmail?: string | null;
        market?: "PH" | "US" | null;
      };
    }
  | { ok: false; error?: string };

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [market, setMarket] = useState<"PH" | "US">("PH");

  // password
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Load current user profile (soft-dependency; page still works if this fails)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/me", { cache: "no-store" });
        const json: UserResponse = await res.json();
        if (!("ok" in json) || !json.ok) throw new Error((json as any)?.error || "Failed to load profile.");

        setName(json.user.name || "");
        setPaypalEmail(json.user.paypalEmail || "");
        // Market: prefer cookie; fallback to user.market; default PH
        const cookieMarket = getCookie("market");
        const m = (cookieMarket || json.user.market || "PH").toUpperCase();
        setMarket(m === "US" ? "US" : "PH");
      } catch (e: any) {
        // Non-fatal: show the form empty, allow user to set values
        setErr(e?.message || "Could not load profile (you can still edit and save).");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setSaving(true);
    try {
      // Name + PayPal email update
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          paypalEmail: paypalEmail.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to save profile.");

      // Set market cookie (1 year)
      setCookie("market", market, 365);
      setMsg("Settings saved.");
    } catch (e: any) {
      setErr(e?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (pw1.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setErr("Passwords do not match.");
      return;
    }
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw1 }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to change password.");
      setMsg("Password updated.");
      setPw1("");
      setPw2("");
    } catch (e: any) {
      setErr(e?.message || "Failed to change password.");
    }
  }

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        title="Settings"
        subtitle="Manage your profile, payout email, and preferences."
      />

      {err && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 p-3 text-sm">
          {err}
        </div>
      )}
      {msg && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 p-3 text-sm">
          {msg}
        </div>
      )}

      {/* Profile & payout */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-medium">Profile & Payout</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Payouts are currently via <strong>PayPal</strong> only. Make sure the email below matches your PayPal account.
        </p>

        <form onSubmit={saveProfile} className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="block text-sm mb-1" htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Your name"
              aria-label="Display name"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm mb-1" htmlFor="paypalEmail">PayPal email</label>
            <input
              id="paypalEmail"
              disabled={loading}
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              type="email"
              placeholder="your-paypal@example.com"
              autoComplete="email"
              aria-label="PayPal email"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm mb-1">Preferred market</label>
            <div className="flex gap-2" role="group" aria-label="Preferred market">
              <button
                type="button"
                onClick={() => setMarket("PH")}
                className={`rounded-md border px-3 py-1.5 text-sm ${market === "PH" ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-gray-50"}`}
                aria-pressed={market === "PH"}
                aria-label="Set market to PH"
              >
                PH
              </button>
              <button
                type="button"
                onClick={() => setMarket("US")}
                className={`rounded-md border px-3 py-1.5 text-sm ${market === "US" ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-gray-50"}`}
                aria-pressed={market === "US"}
                aria-label="Set market to US"
              >
                US
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              We remember this on your device. You can switch anytime from the header.
            </p>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving || loading}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${saving || loading ? "bg-gray-400" : "bg-teal-600 hover:bg-teal-700"}`}
              aria-label="Save settings"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      </section>

      {/* Password */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-medium">Change password</h2>
        <form onSubmit={changePassword} className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 sm:max-w-md">
          <div>
            <label className="block text-sm mb-1" htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              type="password"
              placeholder="At least 8 characters"
              minLength={8}
              aria-label="New password"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              type="password"
              placeholder="Re-enter your password"
              minLength={8}
              aria-label="Confirm password"
            />
          </div>
          <div>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm font-medium"
              aria-label="Update password"
            >
              Update password
            </button>
          </div>
        </form>
      </section>

      {/* Privacy & Sign out */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-medium">Privacy & account</h2>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link href="/privacy" className="text-sm underline" aria-label="Open Privacy Policy">
            Privacy Policy
          </Link>
          <span className="hidden sm:inline text-gray-300" aria-hidden="true">•</span>
          <Link href="/terms" className="text-sm underline" aria-label="Open Terms of Service">
            Terms of Service
          </Link>
          <span className="hidden sm:inline text-gray-300" aria-hidden="true">•</span>
          <Link
            href="/logout"
            className="text-sm rounded-md border px-3 py-1.5 hover:bg-gray-50 w-fit"
            aria-label="Sign out"
          >
            Sign out
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ---------------- utils ---------------- */

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Expires=${expires}; SameSite=Lax`;
}
