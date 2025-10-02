"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AdminDeleteMerchantButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onDelete() {
    if (!id) return;
    const confirmed = window.confirm(
      `Delete merchant "${name}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setBusy(true);
      const res = await fetch("/api/admin/merchant/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert(`Failed to delete: ${json.error || "Unknown error"}`);
        return;
      }
      // Refresh the page data
      startTransition(() => router.refresh());
    } catch (err: any) {
      alert(`Error: ${err?.message || String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy || isPending}
      className="inline-flex items-center rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      title="Delete merchant"
    >
      {busy || isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
