"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type Props = {
  userId: string;
};

type ReferralGroup = {
  expiresAt: string;
  referredUsers: { email: string; createdAt: string }[];
};

export default function ReferralStatusCard({ userId }: Props) {
  const [groups, setGroups] = useState<ReferralGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const res = await axios.get("/api/referrals/list");
        setGroups(res.data);
      } catch (error) {
        console.error("Error fetching referral data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  return (
    <div className="p-6 border rounded bg-white shadow text-center">
      <h2 className="text-lg font-semibold text-teal-700 mb-4">Your Referrals</h2>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading referral data...</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-600 text-sm">No referrals yet.</p>
      ) : (
        groups.map((group, idx) => {
          const expiresIn = Math.max(
            0,
            Math.ceil(
              (new Date(group.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          );
          return (
            <div
              key={idx}
              className="mb-4 p-4 border rounded bg-slate-50 text-left shadow-sm"
            >
              <h3 className="text-md font-medium text-teal-600 mb-2">
                Batch #{idx + 1} — {group.referredUsers.length}/3 referrals
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700 mb-2">
                {group.referredUsers.map((user, i) => (
                  <li key={i}>
                    {user.email} — joined{" "}
                    {new Date(user.createdAt).toLocaleDateString()}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500">
                Days remaining in bonus window:{" "}
                <span className="font-semibold">{expiresIn}</span>
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}
