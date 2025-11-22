"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WaitlistItem = {
  id: string;
  email: string;
  source: string | null;
  status: string;
  createdAt: string;
};

export default function AdminWaitlistPage() {
  const [items, setItems] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // auto-invite toggle state
  const [autoEnabled, setAutoEnabled] = useState<boolean | null>(null);
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoMsg, setAutoMsg] = useState<string | null>(null);

  // Load waitlist
  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/waitlist");
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load waitlist.");
      }

      setItems(data.items);
    } catch (err: any) {
      setMessage(err?.message || "Error loading waitlist.");
    } finally {
      setLoading(false);
    }
  }

  // Load auto-invite setting
  async function loadAutoSetting() {
    setAutoMsg(null);
    try {
      const res = await fetch("/api/admin/waitlist/auto");
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load auto-invite setting.");
      }

      setAutoEnabled(Boolean(data.enabled));
    } catch (err: any) {
      setAutoMsg(err?.message || "Error loading auto-invite setting.");
      setAutoEnabled(null);
    }
  }

  useEffect(() => {
    load();
    loadAutoSetting();
  }, []);

  // Invite next user (manual)
  async function inviteNext() {
    setInviting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/waitlist/invite-next");
      const text = await res.text();

      setMessage(`Response: ${text}`);
      await load();
    } catch (err: any) {
      setMessage(err?.message || "Error inviting next user.");
    } finally {
      setInviting(false);
    }
  }

  // Toggle auto-invite on/off
  async function toggleAutoInvite() {
    if (autoEnabled === null) return;
    setAutoBusy(true);
    setAutoMsg(null);

    try {
      const nextEnabled = !autoEnabled;

      const res = await fetch("/api/admin/waitlist/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data.error || "Failed to update auto-invite setting.");
      }

      setAutoEnabled(nextEnabled);
      setAutoMsg(`Auto-invite is now ${nextEnabled ? "ON" : "OFF"}.`);
    } catch (err: any) {
      setAutoMsg(err?.message || "Error updating auto-invite setting.");
    } finally {
      setAutoBusy(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h1 className="text-2xl font-semibold">Waitlist Admin</h1>

          {/* Quick link to cap settings */}
          <Link
            href="/admin/cap"
            className="text-xs text-teal-700 hover:text-teal-900 underline"
          >
            Adjust user cap
          </Link>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Manage queued users and control how they are invited when capacity opens.
        </p>

        {/* Auto-invite control */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-800">
              Auto-invite from waitlist
            </p>
            <p className="text-xs text-gray-600 mt-1">
              When ON, a backend job can automatically promote the next waiting user
              when there is capacity. Manual “Invite Next User” still works.
            </p>
            {autoMsg && (
              <p className="mt-1 text-xs text-gray-700">{autoMsg}</p>
            )}
          </div>
          <button
            onClick={toggleAutoInvite}
            disabled={autoBusy || autoEnabled === null}
            className={`px-4 py-2 rounded-full text-xs font-medium border ${
              autoEnabled
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-gray-100 text-gray-700 border-gray-300"
            } disabled:opacity-50`}
          >
            {autoEnabled === null
              ? "Loading…"
              : autoEnabled
              ? autoBusy
                ? "Turning off…"
                : "ON"
              : autoBusy
              ? "Turning on…"
              : "OFF"}
          </button>
        </div>

        {/* Manual invite button */}
        <button
          onClick={inviteNext}
          disabled={inviting}
          className="mb-4 rounded-lg bg-teal-600 text-white px-4 py-2 hover:bg-teal-700 disabled:opacity-50"
        >
          {inviting ? "Inviting…" : "Invite Next User"}
        </button>

        {message && (
          <p className="mb-4 text-sm text-gray-700 border border-gray-200 rounded-lg p-3 bg-white">
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-gray-600">Loading waitlist…</p>
        ) : items.length === 0 ? (
          <p className="text-gray-600">No waitlist entries.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 bg-white rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Source</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">{item.email}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.status === "waiting"
                            ? "bg-yellow-100 text-yellow-700"
                            : item.status === "invited"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {item.source || "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-sm">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
