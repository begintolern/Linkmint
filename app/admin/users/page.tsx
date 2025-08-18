// app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";

type MeResp =
  | { success: true; user: { id: string; email: string; name?: string | null; role: string } }
  | { success: false; error: string };

type UsersResp =
  | { success: true; users: Array<{ id: string; email: string; name?: string | null; emailVerified: boolean; createdAt: string; role?: string | null }> }
  | { success: false; error: string };

export default function AdminUsersPage() {
  const [me, setMe] = useState<MeResp | null>(null);
  const [data, setData] = useState<UsersResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1) Who am I?
        const meRes = await fetch("/api/me", { cache: "no-store" });
        const meJson: MeResp = await meRes.json();
        setMe(meJson);

        if (!meJson.success) return; // not logged in
        if (meJson.user.role !== "ADMIN") {
          setData({ success: false, error: "Forbidden" });
          return;
        }

        // 2) Load users
        const usersRes = await fetch("/api/admin/users", { cache: "no-store" });
        const usersJson: UsersResp = await usersRes.json();
        setData(usersJson);
      } catch (e) {
        setData({ success: false, error: "Server error" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin · Users</h1>
        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  if (!me || !me.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin · Users</h1>
        <div className="rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-700">
          You must be logged in to view this page.
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin · Users</h1>
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700">
          {(data as any)?.error === "Forbidden"
            ? "You must be an admin to view this page."
            : "Failed to load users."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin · Users</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">Email</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">Name</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">Verified</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">Role</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 border-b">{u.email}</td>
                <td className="px-3 py-2 border-b">{u.name ?? "—"}</td>
                <td className="px-3 py-2 border-b">
                  {u.emailVerified ? (
                    <span className="text-green-600">Yes</span>
                  ) : (
                    <span className="text-red-600">No</span>
                  )}
                </td>
                <td className="px-3 py-2 border-b">{u.role ?? "USER"}</td>
                <td className="px-3 py-2 border-b">
                  {new Date(u.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
