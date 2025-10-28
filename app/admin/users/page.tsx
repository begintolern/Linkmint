"use client";

import React, { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  email: string | null;
  name: string | null;
  disabled: boolean;
  trustScore: number;
};

type ListResp = {
  ok: boolean;
  total: number;
  page: number;
  limit: number;
  users: User[];
  error?: string;
};

async function apiGetUsers(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  const res = await fetch(`/api/admin/users?${sp.toString()}`, { cache: "no-store" });
  return (await res.json()) as ListResp;
}

async function apiPost(action: string, payload: Record<string, any>) {
  const res = await fetch(`/api/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

export default function AdminUsersPage() {
  // query & paging
  const [q, setQ] = useState("");
  const [disabledFilter, setDisabledFilter] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // data
  const [rows, setRows] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // local trust edits
  const [trustDraft, setTrustDraft] = useState<Record<string, string>>({});

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params: Record<string, any> = { page, limit };
      if (q.trim()) params.q = q.trim();
      if (disabledFilter !== "all") params.disabled = disabledFilter;
      const data = await apiGetUsers(params);
      if (!data.ok) {
        setErr(data.error || "Failed to load users");
      } else {
        setRows(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, disabledFilter]);

  function resetPagingAndLoad() {
    setPage(1);
    // load will auto-run via effect when page changes
    setTimeout(() => load(), 0);
  }

  async function doAction(
    idOrEmail: { userId?: string; email?: string },
    action: "enable" | "disable" | "unfreeze" | "setTrustScore",
    trustScore?: number
  ) {
    const key = idOrEmail.userId || idOrEmail.email || "";
    setBusyId(key);
    setErr(null);
    try {
      const payload: any = { ...idOrEmail };
      if (action === "setTrustScore") payload.trustScore = trustScore;
      const res = await apiPost(action, payload);
      if (!res?.ok) {
        setErr(res?.error || `Action ${action} failed`);
      } else {
        // refresh list inline
        setRows((prev) =>
          prev.map((u) => (u.id === res.user.id ? { ...u, ...res.user } : u))
        );
      }
    } catch (e: any) {
      setErr(e?.message || `Action ${action} failed`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin · Users</h1>
        <div className="text-sm text-gray-500">
          Total: {total} | Page {page} / {totalPages}
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Search (name/email)</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && resetPagingAndLoad()}
            placeholder="Type and press Enter…"
            className="border rounded-lg px-3 py-2 w-64"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Disabled</label>
          <select
            value={disabledFilter}
            onChange={(e) => setDisabledFilter(e.target.value as any)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All</option>
            <option value="true">Only Disabled</option>
            <option value="false">Only Enabled</option>
          </select>
        </div>
        <button
          onClick={resetPagingAndLoad}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:opacity-90"
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto">
        <table className="min-w-full border rounded-xl overflow-hidden">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="text-left p-3 border-b">ID</th>
              <th className="text-left p-3 border-b">Email</th>
              <th className="text-left p-3 border-b">Name</th>
              <th className="text-left p-3 border-b">Disabled</th>
              <th className="text-left p-3 border-b">TrustScore</th>
              <th className="text-left p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map((u) => {
              const key = u.id;
              const draft = trustDraft[key] ?? String(u.trustScore);
              const disabled = busyId === key;

              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b align-top">
                    <div className="font-mono text-xs break-all">{u.id}</div>
                  </td>
                  <td className="p-3 border-b align-top">{u.email}</td>
                  <td className="p-3 border-b align-top">{u.name}</td>
                  <td className="p-3 border-b align-top">
                    {u.disabled ? (
                      <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                        disabled
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                        active
                      </span>
                    )}
                  </td>
                  <td className="p-3 border-b align-top">
                    <div className="flex items-center gap-2">
                      <input
                        className="border rounded px-2 py-1 w-20"
                        value={draft}
                        onChange={(e) =>
                          setTrustDraft((s) => ({ ...s, [key]: e.target.value }))
                        }
                      />
                      <button
                        disabled={disabled}
                        onClick={() =>
                          doAction({ userId: u.id }, "setTrustScore", Number(draft))
                        }
                        className="px-2 py-1 rounded bg-gray-800 text-white text-xs hover:opacity-90"
                      >
                        {disabled ? "…" : "Set"}
                      </button>
                    </div>
                  </td>
                  <td className="p-3 border-b align-top">
                    <div className="flex flex-wrap gap-2">
                      {u.disabled ? (
                        <button
                          disabled={disabled}
                          onClick={() => doAction({ userId: u.id }, "enable")}
                          className="px-3 py-1 rounded-xl bg-green-600 text-white text-xs hover:opacity-90"
                        >
                          {disabled ? "…" : "Enable"}
                        </button>
                      ) : (
                        <button
                          disabled={disabled}
                          onClick={() => doAction({ userId: u.id }, "disable")}
                          className="px-3 py-1 rounded-xl bg-red-600 text-white text-xs hover:opacity-90"
                        >
                          {disabled ? "…" : "Disable"}
                        </button>
                      )}
                      <button
                        disabled={disabled}
                        onClick={() => doAction({ userId: u.id }, "unfreeze")}
                        className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs hover:opacity-90"
                      >
                        {disabled ? "…" : "Unfreeze (0)"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && !loading && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          className="px-4 py-2 rounded-xl border"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Prev
        </button>
        <div className="text-sm text-gray-600">
          Page {page} / {totalPages}
        </div>
        <button
          className="px-4 py-2 rounded-xl border"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}
