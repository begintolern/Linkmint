// app/admin/referrals/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { assertAdmin } from "@/lib/utils/adminGuard";
import { prisma } from "@/lib/db";

export default async function AdminReferralsPage() {
  await assertAdmin();

  // Adjust to your schema: assuming a ReferralGroup table with:
  // id, referrerId, startedAt, expiresAt, status, users (the 3 invitees)
  const groups = await prisma.referralGroup.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      startedAt: true,
      expiresAt: true,
      referrer: { select: { id: true, email: true } },
      users: { select: { id: true, email: true, emailVerifiedAt: true, createdAt: true } }, // invitees
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold">Admin · Referrals</h1>
      <p className="text-sm text-slate-600 mt-1">
        Latest 50 referral batches (3-invite groups)
      </p>

      <div className="mt-6 grid gap-4">
        {groups.map((g) => {
          const now = Date.now();
          const expires = g.expiresAt ? new Date(g.expiresAt).getTime() : null;
          const daysLeft =
            expires ? Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24))) : null;

          return (
            <div key={g.id} className="rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-semibold">
                    Referrer: {g.referrer?.email ?? "—"}
                  </div>
                  <div className="text-slate-600">
                    Started: {new Date(g.startedAt).toLocaleString()}
                    {g.expiresAt && (
                      <>
                        {" · "}Expires: {new Date(g.expiresAt).toLocaleString()}
                        {" · "}Days left: {daysLeft}
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs rounded-md border px-2 py-0.5">
                  {String(g.status ?? "active").toUpperCase()}
                </span>
              </div>

              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-2">Invitees</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {g.users.map((u) => (
                    <div key={u.id} className="rounded-md border p-3 text-sm">
                      <div className="font-medium">{u.email ?? "—"}</div>
                      <div className="text-xs text-slate-600">
                        Joined: {new Date(u.createdAt).toLocaleString()}
                        {" · "}
                        {u.emailVerifiedAt ? "Verified" : "Unverified"}
                      </div>
                    </div>
                  ))}
                  {g.users.length === 0 && (
                    <div className="text-sm text-slate-600">No invitees yet.</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="text-sm text-slate-600">No referral groups found.</div>
        )}
      </div>
    </main>
  );
}
