// components/ReferralLinkSection.tsx
"use client";

import { useState } from "react";

export default function ReferralLinkSection() {
  const [copySuccess, setCopySuccess] = useState(false);

  const referralLink = "https://linkmint.co/r/mint8492"; // You can replace with dynamic link logic

  const handleCopyClick = () => {
    navigator.clipboard.writeText(referralLink).then(
      () => setCopySuccess(true),
      () => setCopySuccess(false)
    );
  };

  return (
    <div className="rounded-2xl p-5 border border-gray-200 shadow-sm bg-white">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Your Referral Link</h2>
        <p className="text-sm text-gray-500">Share this link to earn commissions on referred sales.</p>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <input
          type="text"
          readOnly
          value={referralLink}
          className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
        />
        <button
          onClick={handleCopyClick}
          className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded"
        >
          {copySuccess ? "Copied!" : "Copy"}
        </button>
      </div>

      <p className="text-sm text-green-600">
        {copySuccess ? "Link copied successfully!" : ""}
      </p>
    </div>
  );
}
