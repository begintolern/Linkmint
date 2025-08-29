// pages/api/admin/delete-user.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, route: "pages/api/admin/delete-user" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const raw = await getServerSession(req, res, authOptions as any);
  const session = raw as Session | null;

  const emailOnSession = session?.user?.email?.toLowerCase() || "";
  const role = String((session?.user as any)?.role ?? "").toUpperCase();
  if (!emailOnSession) return res.status(401).json({ success: false, error: "Unauthorized" });
  if (role !== "ADMIN") return res.status(403).json({ success: false, error: "Forbidden" });

  const { email, userId } = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) || {};
  if (!email && !userId) return res.status(400).json({ success: false, error: "Provide email or userId" });

  const user =
    (userId && (await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } }))) ||
    (email && (await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })));

  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const deletions: Record<string, number> = {};

      try {
        const r = await tx.commission.deleteMany({ where: { userId: user.id } });
        deletions.commissions = r.count;
      } catch {}

      try {
        const r = await tx.payout.deleteMany({ where: { userId: user.id } });
        deletions.payouts = r.count;
      } catch {}

      try {
        // Optional Referral model cleanup (ignored if model doesn't exist)
        // @ts-ignore
        const r1 = await tx.referral?.deleteMany({ where: { inviterUserId: user.id } });
        // @ts-ignore
        const r2 = await tx.referral?.deleteMany({ where: { referredUserId: user.id } });
        deletions.referrals = (r1?.count || 0) + (r2?.count || 0);
      } catch {}

      const deletedUser = await tx.user.delete({ where: { id: user.id } });

      return { deletedUserId: deletedUser.id, deletions };
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message ?? "Delete failed" });
  }
}
