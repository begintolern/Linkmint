// app/components/MarketSwitcher.tsx
"use client";

import { useState, useEffect } from "react";

export default function MarketSwitcher() {
  const [market, setMarket] = useState<string | null>(null);

  useEffect(() => {
    const m = document.cookie
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith("lm_market="));
    setMarket(m ? decodeURIComponent(m.split("=")[1]).toUpperCase() : null);
  }, []);

  const go = (to: "PH" | "US") => {
    const back = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/api/market/set?to=${to}&back=${back}`;
  };

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 text-sm px-4 py-2 flex items-center justify-between">
      <span>
        Market override: <strong>{market || "Auto (by IP)"}</strong>
      </span>
      <div className="space-x-2">
        <button
          onClick={() => go("PH")}
          className="px-3 py-1 rounded-md border border-amber-300 hover:bg-amber-100"
        >
          Switch to PH
        </button>
        <button
          onClick={() => go("US")}
          className="px-3 py-1 rounded-md border border-amber-300 hover:bg-amber-100"
        >
          Switch to US
        </button>
      </div>
    </div>
  );
}
