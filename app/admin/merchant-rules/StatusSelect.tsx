"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  initial: "PENDING" | "ACTIVE" | "REJECTED";
  onChanged?: (next: Props["initial"]) => void;
};

export default function StatusSelect({ id, initial, onChanged }: Props) {
  const [value, setValue] = useState<Props["initial"]>(initial);
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function update(next: Props["initial"]) {
    setErr(null);
    const prev = value;
    setValue(next); // optimistic

    try {
      const res = await fetch(`/api/merchant-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged?.(next);
      router.refresh();            // 🔁 re-render server components (badge updates)
    } catch (e: any) {
      setValue(prev);              // rollback
      setErr(e?.message ?? "Update failed");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="text-xs border rounded-md px-2 py-1 bg-white"
        value={value}
        onChange={(e) => {
          const next = e.target.value as Props["initial"];
          startTransition(() => update(next));
        }}
        disabled={isPending}
      >
        <option value="PENDING">PENDING</option>
        <option value="ACTIVE">ACTIVE</option>
        <option value="REJECTED">REJECTED</option>
      </select>
      {isPending && <span className="text-xs text-gray-400">Saving…</span>}
      {err && <span className="text-xs text-red-600">Error: {err}</span>}
    </div>
  );
}
