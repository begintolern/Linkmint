"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type ReferralStats = {
  referralLink: string;
  totalReferrals: number;
  isActive: boolean;
  expiresAt: string | null;
};

export default function ReferralStatusCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralStats = async () => {
      try {
        const res = await axios.get("/api/referrals");
        console.log("🧪 API response:", res.data);
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch referral stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralStats();
  }, []);

  if (loading) return <div className="p-4 bg-white shadow rounded">Loading...</div>;
  if (!stats) return <div className="p-4 bg-red-100 text-red-700">Error loading referral data.</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow mb-4">
      <h2 className="text-lg font-semibold mb-2 text-blue-600">Your Referral Status ✅ DASHBOARD VERSION</h2>

      <p className="mb-2">
        <strong>Referral Link:</strong>{" "}
        <a href={stats.referralLink} className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">
          {stats.referralLink}
        </a>
      </p>
      <p className="mb-2">
        <strong>Total Referrals:</strong> {stats.totalReferrals}
      </p>
      <p className="mb-2">
        <strong>Status:</strong> {stats.isActive ? "Active" : "Inactive"}
      </p>
      {stats.expiresAt && (
        <p className="mb-2">
          <strong>Expires At:</strong> {new Date(stats.expiresAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
