"use client";

import { useState } from "react";

type Props = {
  userId: string;
  reason?: string;
  className?: string;
  onDone?: (result: { ok: boolean; error?: string }) => void;
};

/**
 * Reusable admin-only button that soft-freezes a user (sets user.disabled = true)
 * Requires either:
 *  - admin session (logged-in admin), or
 *  - x-admin-key header (not sent here; rely on admin session for UI usage)
 */
export default function FreezeUserButton({
  userId,
  reason = "Account frozen by admin review",
  className = "",
  onDone,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleClick() {
    if (!userId) {
      setErr("Missing userId");
      return;
    }
    const confirm = window.confirm(
      "Freeze this user account now? They will be unable to log in until re-enabled."
    );
    if (!confirm) return;

    setBusy(true);
    setErr(null);
    setDone(false);

    try {
      const res = await fetch("/api/admin/users/freeze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ userId, reason }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const msg = data?.error || "Freeze failed";
        setErr(msg);
        onDone?.({ ok: false, error: msg });
        return;
      }

      setDone(true);
      onDone?.({ ok: true });
    } catch (e: any) {
      const msg = e?.message || "Network error";
      setErr(msg);
      onDone?.({ ok: false, error: msg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || done}
        className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white ${
          done
            ? "bg-gray-400 cursor-default"
            : busy
            ? "bg-slate-600"
            : "bg-red-600 hover:bg-red-700"
        }`}
        title="Freeze user (disable login)"
      >
        {done ? "Frozen" : busy ? "Freezing…" : "Freeze User"}
      </button>

      {err && (
        <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {err}
        </div>
      )}

      {done && (
        <div className="mt-2 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
          User frozen.
        </div>
      )}
    </div>
  );
}
