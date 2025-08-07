"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// Define the expected props
type Props = {
  userId: string;
};

type ReferralBatch = {
  id: string;
  bonusWindowExpiresAt: string;
  referredUsers: {
    email: string;
    createdAt: string;
  }[];
};

export default function ReferralStatusCard({ userId }: Props) {
  const [batches, setBatches] = useState<ReferralBatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReferrals = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/referrals");
        setBatches(res.data.batches);
      } catch (error) {
        console.error("Failed to fetch referrals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [userId]);

  if (loading) return <div>Loading referral status...</div>;
  if (batches.length === 0) return <div>You haven’t invited anyone yet.</div>;

  return (
    <div className="space-y-4">
      {batches.map((batch) => {
        const daysLeft = Math.max(
          0,
          Math.floor(
            (new Date(batch.bonusWindowExpiresAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        );

        return (
          <div
            key={batch.id}
            className="border border-teal-300 rounded p-4 shadow-sm bg-white"
          >
            <h3 className="font-semibold text-teal-700 mb-2">
              Referral Batch ({batch.referredUsers.length}/3)
            </h3>
            <ul className="text-sm text-gray-700 mb-2">
              {batch.referredUsers.map((user, i) => (
                <li key={i}>• {user.email}</li>
              ))}
            </ul>
            <p className="text-sm text-gray-500">
              Bonus Window: {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
            </p>
          </div>
        );
      })}
    </div>
  );
}
