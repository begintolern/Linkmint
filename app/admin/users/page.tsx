"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { useEffect, useState } from "react";

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  trustScore: number | null;
  createdAt: string;
  emailVerifiedAt: string | null;
};

function parseIntSafe(x: string | null): number | null {
  if (!x) return null;
  const n = parseInt(x, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(next?: string | null) {
    try {
      setLoading(true);
      setErr(null);
      const url = new URL("/api/admin/users", window.location.origin);
      url.searchParams.set("limit", "10");
      if (next) url.searchParams.set("cursor", next);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setRows((prev) => (next ? [...prev, ...json.rows] : json.rows));
      setCursor(json.nextCursor ?? null);
    } catch (e: any) {
      setErr(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patchUser(id: string, body: any) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      const updated = json.user as Row;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch (e: any) {
      alert(e.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin · Users</h1>
        <button
          onClick={() => load(null)}
          className="text-sm rounded-lg px-3 py-2 ring-1 ring-zinc-300 hover:bg-zinc-50"
        >
          Refresh
        </button>
      </header>

      {err && (
        <div className="rounded-xl bg-red-50 text-red-800 ring-1 ring-red-200 p-3 text-sm">
          {err}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl ring-1 ring-zinc-200">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left">
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Trust</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Actions</th>
              <th className="px-4 py-3">ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={8}>
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const verified = !!u.emailVerifiedAt;
                const isAdmin = (u.role ?? "user").toUpperCase() === "ADMIN";
                return (
                  <tr key={u.id} className="border-t border-zinc-200 align-middle">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">{u.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs">
                        {u.role ?? "user"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.trustScore ?? 0}</td>
                    <td className="px-4 py-3">
                      {verified ? new Date(u.emailVerifiedAt!).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => patchUser(u.id, { verifyEmail: true })}
                          disabled={busyId === u.id || verified}
                          className="text-xs rounded-md px-2 py-1 ring-1 ring-zinc-300 disabled:opacity-50 hover:bg-zinc-50"
                          title={verified ? "Already verified" : "Mark email verified"}
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => patchUser(u.id, { makeAdmin: true })}
                          disabled={busyId === u.id || isAdmin}
                          className="text-xs rounded-md px-2 py-1 ring-1 ring-zinc-300 disabled:opacity-50 hover:bg-zinc-50"
                          title={isAdmin ? "Already admin" : "Make admin"}
                        >
                          Make Admin
                        </button>
                        <button
                          onClick={() => patchUser(u.id, { makeUser: true })}
                          disabled={busyId === u.id || !isAdmin}
                          className="text-xs rounded-md px-2 py-1 ring-1 ring-zinc-300 disabled:opacity-50 hover:bg-zinc-50"
                          title={!isAdmin ? "Already user" : "Revoke admin"}
                        >
                          Make User
                        </button>
                        <button
                          onClick={() => {
                            const inc = prompt("Increase trust by (positive integer):", "5");
                            const n = parseIntSafe(inc);
                            if (n) patchUser(u.id, { bumpTrust: n });
                          }}
                          disabled={busyId === u.id}
                          className="text-xs rounded-md px-2 py-1 ring-1 ring-green-300 disabled:opacity-50 hover:bg-green-50"
                          title="Increase trust score"
                        >
                          Bump Trust
                        </button>
                        <button
                          onClick={() => {
                            const dec = prompt("Reduce trust by (positive integer):", "5");
                            const n = parseIntSafe(dec);
                            if (n) patchUser(u.id, { dropTrust: n });
                          }}
                          disabled={busyId === u.id}
                          className="text-xs rounded-md px-2 py-1 ring-1 ring-red-300 disabled:opacity-50 hover:bg-red-50"
                          title="Reduce trust score"
                        >
                          Reduce Trust
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[32ch] truncate" title={u.id}>
                      {u.id}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => load(cursor)}
          disabled={!cursor || loading}
          className="text-sm rounded-lg px-3 py-2 ring-1 ring-zinc-300 disabled:opacity-50"
        >
          {loading ? "Loading..." : cursor ? "Load more" : "No more"}
        </button>
      </div>
    </main>
  );
}
