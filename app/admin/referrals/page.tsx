// app/admin/referrals/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export default async function AdminReferralsPage() {
  // Auth
  const session = await (getServerSession as any)(authOptions as any);
  if (!session?.user?.email) redirect("/login");

  // Ensure ADMIN
  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!me || me.role !== "ADMIN") {
    redirect("/"); // or return a 403 page if you prefer
  }

  // Load referral groups
  const groups = await prisma.referralGroup.findMany({
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      startedAt: true,
      expiresAt: true,
      referrer: { select: { email: true } },
      users: { select: { email: true } },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin · Referral Groups</h1>

      <div className="rounded-lg border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2">Group ID</th>
              <th className="px-3 py-2">Referrer</th>
              <th className="px-3 py-2">Members (count)</th>
              <th className="px-3 py-2">Started</th>
              <th className="px-3 py-2">Expires</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={5}>
                  No referral groups yet.
                </td>
              </tr>
            ) : (
              groups.map((g) => (
                <tr key={g.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{g.id}</td>
                  <td className="px-3 py-2">{g.referrer?.email ?? "—"}</td>
                  <td className="px-3 py-2">
                    {g.users.length}
                    {g.users.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {g.users.map((u) => u.email).join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{fmt(g.startedAt as any)}</td>
                  <td className="px-3 py-2">{fmt(g.expiresAt as any)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
