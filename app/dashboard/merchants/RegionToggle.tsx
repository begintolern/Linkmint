"use client";

import { useMemo } from "react";

type Mode = "PH" | "ALL";

function setParam(url: URL, key: string, val?: string) {
  if (!val) url.searchParams.delete(key);
  else url.searchParams.set(key, val);
}

export default function RegionToggle() {
  // Read current mode from URL (?all=1 → ALL, otherwise PH)
  const mode: Mode = useMemo(() => {
    if (typeof window === "undefined") return "PH";
    const sp = new URLSearchParams(window.location.search);
    return sp.get("all") === "1" ? "ALL" : "PH";
  }, []);

  const onChange = (next: Mode) => {
    const url = new URL(window.location.href);
    if (next === "ALL") {
      setParam(url, "all", "1");  // show all regions
      url.searchParams.delete("region"); // ignore any old region filter
    } else {
      setParam(url, "all", undefined);
      setParam(url, "region", "PH"); // force PH
    }
    // Navigate (preserves path, updates query)
    window.location.href = url.toString();
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-gray-600">View:</span>
      <select
        className="border rounded-md px-2 py-1 text-sm"
        defaultValue={mode}
        onChange={(e) => onChange(e.target.value as Mode)}
        aria-label="Admin region view"
        title="Admin region view"
      >
        <option value="PH">PH only</option>
        <option value="ALL">All regions</option>
      </select>
    </div>
  );
}
