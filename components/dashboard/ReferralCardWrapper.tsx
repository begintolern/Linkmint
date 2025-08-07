"use client";

import { useEffect, useState } from "react";

interface ReferralData {
  referralLink: string;
  totalReferrals: number;
  expiresAt: string | null;
  referredUsers: string[];
}

export default function ReferralCardWrapper() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch("/api/referrals");
        const json = await res.json();
        console.log("Referral API response:", json); // 🧪 Debug line

        if (json.error) {
          console.error("Referral API error:", json.error);
          setData(null);
        } else {
          setData({
            referralLink: json.referralLink,
            totalReferrals: json.totalReferrals || 0,
            expiresAt: json.expiresAt,
            referredUsers: json.referredUsers || [],
          });
        }
      } catch (err) {
        console.error("Failed to load referrals:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchReferrals();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading referral info...</div>;
  }

  if (!data) {
    return <div className="text-red-500">Failed to load referral info.</div>;
  }

  const daysLeft = data.expiresAt ? getDaysRemaining(data.expiresAt) : null;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border">
      <h2 className="text-xl font-semibold mb-2">Referral Status</h2>
      <p>
        <strong>Your referral link:</strong>{" "}
        <a href={data.referralLink} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
          {data.referralLink}
        </a>
      </p>
      <p>
        <strong>Total invited:</strong> {data.totalReferrals}
      </p>
      <p>
        <strong>Expires:</strong>{" "}
        {data.expiresAt ? new Date(data.expiresAt).toLocaleString() : "No expiration date"}
      </p>
      {daysLeft !== null && (
        <p className="text-yellow-600 mt-2">
          🕒 {daysLeft} days remaining in bonus window.
        </p>
      )}
      <ul className="list-disc ml-6 text-sm text-gray-700 mt-2">
        {data.referredUsers.map((email, idx) => (
          <li key={idx}>{email}</li>
        ))}
      </ul>
    </div>
  );
}

function getDaysRemaining(dateStr: string): number {
  const now = new Date();
  const expiry = new Date(dateStr);
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
