"use client";
import { useState } from "react";

export default function ApproveButton({ logId }: { logId: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onApprove() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/payouts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      setDone(true);
      location.reload();
    } catch (e: any) {
      alert(e.message || "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onApprove}
      disabled={busy || done}
      className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50"
      title="Mark payout as APPROVED"
    >
      {done ? "Approved" : busy ? "Approving…" : "Approve"}
    </button>
  );
}
