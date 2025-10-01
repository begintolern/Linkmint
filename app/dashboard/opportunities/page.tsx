// app/dashboard/opportunities/page.tsx
"use client";

import { useState } from "react";

type Opp = {
  id: string;
  title: string;
  desc: string;
  merchant: string;
};

const SAMPLE: Opp[] = [
  {
    id: "1",
    title: "20% Off Shoes",
    desc: "Share this trending fall offer. Excludes gift cards.",
    merchant: "Example Store",
  },
  {
    id: "2",
    title: "Cashback on Travel Bookings",
    desc: "Earn commissions when friends book flights or hotels.",
    merchant: "TravelNow",
  },
  {
    id: "3",
    title: "Pet Supplies Sale",
    desc: "Up to 30% off popular pet care brands.",
    merchant: "PetMart",
  },
];

export default function OpportunitiesPage() {
  const [copied, setCopied] = useState<string | null>(null);

  function handleCopy(opp: Opp) {
    // Simulate link copy
    navigator.clipboard
      .writeText(`https://linkmint.co/link/${opp.id}`)
      .then(() => setCopied(opp.id));
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Opportunities</h1>
      <p className="text-sm text-gray-600 mb-6">
        Suggested deals you can share. Copy a link and post it anywhere.
      </p>

      <div className="grid gap-4">
        {SAMPLE.map((opp) => (
          <div
            key={opp.id}
            className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="text-lg font-medium">{opp.title}</h2>
              <p className="text-sm text-gray-600">{opp.desc}</p>
              <p className="text-xs text-gray-500 mt-1">Merchant: {opp.merchant}</p>
            </div>
            <button
              onClick={() => handleCopy(opp)}
              className="mt-3 sm:mt-0 sm:ml-4 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              {copied === opp.id ? "✅ Copied!" : "Copy Link"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
