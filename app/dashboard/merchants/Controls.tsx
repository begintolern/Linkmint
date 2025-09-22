"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function Controls() {
  const router = useRouter();
  const sp = useSearchParams()!; // non-null assertion

  const [q, setQ] = useState(sp?.get("q") ?? "");
  const [activeOnly, setActiveOnly] = useState((sp?.get("activeOnly") ?? "false") === "true");

  useEffect(() => {
    setQ(sp?.get("q") ?? "");
    setActiveOnly((sp?.get("activeOnly") ?? "false") === "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp?.toString()]);

  function applyFilters() {
    const p = new URLSearchParams(sp?.toString() ?? "");
    if (q.trim()) p.set("q", q.trim());
    else p.delete("q");
    p.set("activeOnly", String(activeOnly));
    router.push(`/dashboard/merchants?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search merchants…"
        className="rounded-lg border px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={activeOnly}
          onChange={(e) => setActiveOnly(e.target.checked)}
        />
        Active only
      </label>
      <button
        onClick={applyFilters}
        className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
      >
        Apply
      </button>
    </div>
  );
}
