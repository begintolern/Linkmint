"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  initial: { severity: string; q: string; from: string; to: string };
};

const severities = ["", "NONE", "LOW", "MEDIUM", "HIGH"];

export default function Filters({ initial }: Props) {
  const router = useRouter();
  const search = useSearchParams()!;

  const [severity, setSeverity] = useState(initial.severity);
  const [q, setQ] = useState(initial.q);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  // Keep local state in sync if user hits back/forward
  useEffect(() => {
    setSeverity(search.get("severity") ?? "");
    setQ(search.get("q") ?? "");
    setFrom(search.get("from") ?? "");
    setTo(search.get("to") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function apply() {
    const params = new URLSearchParams();
    if (severity) params.set("severity", severity);
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  function clearAll() {
    setSeverity("");
    setQ("");
    setFrom("");
    setTo("");
    router.push("?");
  }

  return (
    <div className="flex flex-wrap gap-3 items-end border rounded p-3 bg-gray-50">
      <div className="flex flex-col">
        <label className="text-xs text-gray-600 mb-1">Severity</label>
        <select
          className="border rounded px-2 py-1"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          {severities.map((s) => (
            <option key={s || "any"} value={s}>
              {s ? s : "Any"}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-600 mb-1">From</label>
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-600 mb-1">To</label>
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <div className="flex-1 min-w-[200px] flex flex-col">
        <label className="text-xs text-gray-600 mb-1">Search</label>
        <input
          className="border rounded px-2 py-1"
          placeholder="engine, category, or snippet"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
      </div>

      <button
        onClick={apply}
        className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Apply
      </button>
      <button
        onClick={clearAll}
        className="px-3 py-1.5 rounded border"
      >
        Clear
      </button>
    </div>
  );
}
