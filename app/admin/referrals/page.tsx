// app/admin/referrals/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { assertAdmin } from "@/lib/utils/adminGuard";
import { prisma } from "@/lib/db";

type RefUser = {
  id: string;
  email: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date | string;
};

type Referrer = {
  id: string;
  email: string | null;
};

type Group = {
  id: string;
  startedAt: Date | string;
  expiresAt: Date | string | null;
  referrer: Referrer | null;
  users: RefUser[];
};

export default async function AdminReferralsPage() {
  await assertAdmin();

  // Adjust to your schema: no `status` column; we infer from expiresAt
  const groups: Group[] = await prisma.referralGroup.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
    select: {
      id: true,
      startedAt: true,
      expiresAt: true,
      referrer: { select: { id: true, email: true } },
      users: { select: { id: true, email: true, emailVerifiedAt: true, createdAt: true } },
    },
  });

  const nowMs = Date.now();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold">Admin · Referrals</h1>
      <p className="text-sm text-slate-600 mt-1">
        Latest 50 referral batches (3-invite groups)
      </p>

      <div className="mt-6 grid gap-4">
        {groups.map((g: Group) => {
          const expiresMs = g.expiresAt ? new Date(g.expiresAt).getTime() : null;
          const daysLeft =
            expiresMs != null ? Math.max(0, Math.ceil((expiresMs - nowMs) / (1000 * 60 * 60 * 24))) : null;
          const statusLabel =
            expiresMs == null ? "ACTIVE" : expiresMs > nowMs ? "ACTIVE" : "EXPIRED";

          return (
            <div key={g.id} className="rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-semibold">
                    Referrer: {g.referrer?.email ?? "—"}
                  </div>
                  <div className="text-slate-600">
                    Started: {new Date(g.startedAt as any).toLocaleString()}
                    {g.expiresAt && (
                      <>
                        {" · "}Expires: {new Date(g.expiresAt as any).toLocaleString()}
                        {" · "}Days left: {daysLeft}
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs rounded-md border px-2 py-0.5">
                  {statusLabel}
                </span>
              </div>

              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-2">Invitees</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {g.users.map((u: RefUser) => (
                    <div key={u.id} className="rounded-md border p-3 text-sm">
                      <div className="font-medium">{u.email ?? "—"}</div>
                      <div className="text-xs text-slate-600">
                        Joined: {new Date(u.createdAt as any).toLocaleString()}
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
