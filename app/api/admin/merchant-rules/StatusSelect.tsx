"use client";

import { useState } from "react";

type Status = "PENDING" | "ACTIVE" | "REJECTED";

export default function StatusSelect({
  id,
  initial,
}: {
  id: string;
  initial: Status;
}) {
  const [value, setValue] = useState<Status>(initial);
  const [loading, setLoading] = useState(false);

  async function handleChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const next = e.target.value as Status;
    const prev = value;

    setValue(next);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/merchant-rules/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Status update failed:", err);
      // revert if error
      setValue(prev);
      alert("Failed to update merchant status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={loading}
      className="text-xs border rounded-md px-2 py-1 bg-white"
    >
      <option value="PENDING">PENDING</option>
      <option value="ACTIVE">ACTIVE</option>
      <option value="REJECTED">REJECTED</option>
    </select>
  );
}
