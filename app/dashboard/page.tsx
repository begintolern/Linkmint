export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import ReferralCardWrapper from "@/components/dashboard/ReferralCardWrapper";
import CommissionCard from "@/components/dashboard/CommissionCard";
import ReferralStatusCard from "@/components/dashboard/ReferralStatusCard";
import { prisma } from "@/lib/db";
import LogoutButton from "@/components/dashboard/LogoutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      email: true,
      emailVerified: true,
      trustScore: true,
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome to your Dashboard!</h1>
        <LogoutButton />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 border">
        <p><strong>Email:</strong> {user?.email}</p>
        <p>
          <strong>Email Verified:</strong>{" "}
          {user?.emailVerified ? (
            <span className="text-green-600">Yes</span>
          ) : (
            <span className="text-red-600">No</span>
          )}
        </p>
        <p>
          <strong>Trust Score:</strong>{" "}
          {user?.trustScore !== undefined ? user.trustScore : "N/A"}
        </p>
      </div>

      <ReferralCardWrapper />
      <ReferralStatusCard />
      <CommissionCard />
    </div>
  );
}
