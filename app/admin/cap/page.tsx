"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CapResponse = {
  ok: boolean;
  cap: number;
  defaultCap: number;
};

export default function AdminCapPage() {
  const [cap, setCap] = useState<number | null>(null);
  const [newCap, setNewCap] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Load current cap
  async function loadCap() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/cap");
      const data: CapResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error("Failed to load user cap.");
      }

      setCap(data.cap);
    } catch (err: any) {
      setMessage(err?.message || "Error loading user cap.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCap();
  }, []);

  // Update cap
  async function updateCap() {
    if (!newCap.trim()) return;

    setUpdating(true);
    setMessage(null);

    try {
      const value = parseInt(newCap.trim(), 10);
      if (isNaN(value) || value < 1) {
        setMessage("Cap must be a valid positive number.");
        setUpdating(false);
        return;
      }

      const res = await fetch("/api/admin/cap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cap: value }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update cap.");
      }

      setMessage("User cap updated successfully.");
      setNewCap("");
      loadCap();
    } catch (err: any) {
      setMessage(err?.message || "Error updating cap.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-2">User Cap</h1>

        {/* Back link */}
        <Link
          href="/admin/waitlist"
          className="text-sm text-teal-700 hover:text-teal-900 underline block mb-6"
        >
          ← Back to Waitlist
        </Link>

        <p className="text-sm text-gray-600 mb-6">
          Control how many active users linkmint.co allows before redirecting new signups to the waitlist.
        </p>

        {loading ? (
          <p className="text-gray-600">Loading current cap…</p>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-2">
              <span className="font-medium">Current cap:</span>{" "}
              {cap !== null ? cap : "—"}
            </p>

            <div className="mt-4">
              <label className="block text-sm mb-1">
                New cap value
              </label>

              <input
                type="number"
                value={newCap}
                onChange={(e) => setNewCap(e.target.value)}
                placeholder="e.g. 100"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
              />

              <button
                onClick={updateCap}
                disabled={updating}
                className="mt-3 w-full rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {updating ? "Updating…" : "Update Cap"}
              </button>
            </div>
          </div>
        )}

        {message && (
          <p className="mt-4 text-sm text-gray-700 border border-gray-200 bg-white p-3 rounded-lg">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
