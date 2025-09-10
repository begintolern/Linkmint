"use client";

import { useState } from "react";

export default function DeleteRuleButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete "${name}"?\nThis cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/merchant-rules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || j?.error || `HTTP ${res.status}`);
      }
      window.location.reload();
    } catch (e: any) {
      alert("Delete failed: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      className="text-red-600 text-sm hover:underline disabled:opacity-60"
      title="Delete rule"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
