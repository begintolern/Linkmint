// app/dashboard/settings/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState } from "react";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notifications, setNotifications] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Settings saved (wire this to backend later).");
  };

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-2">Settings</h1>
      <p className="text-sm text-gray-600 mb-6">
        Manage your account preferences.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border p-4"
      >
        {/* Email */}
        <section>
          <h2 className="text-lg font-medium mb-2">Email</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter new email"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </section>

        {/* Password */}
        <section>
          <h2 className="text-lg font-medium mb-2">Password</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-lg font-medium mb-2">Notifications</h2>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="h-4 w-4"
            />
            Enable email notifications
          </label>
        </section>

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>
    </main>
  );
}
