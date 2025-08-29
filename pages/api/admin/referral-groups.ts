// pages/api/admin/referral-groups.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ success: false, error: "Method not allowed" });

  const raw = await getServerSession(req, res, authOptions as any);
  const session = raw as Session | null;
  const emailOnSession = session?.user?.email?.toLowerCase() || "";
  const role = String((session?.user as any)?.role ?? "").toUpperCase();
  if (!emailOnSession) return res.status(401).json({ success: false, error: "Unauthorized" });
  if (role !== "ADMIN") return res.status(403).json({ success: false, error: "Forbidden" });

  // Load inviters (anyone who has at least 1 referred user)
  const referredUsers = await prisma.user.findMany({
    where: { referredById: { not: null } },
    select: { id: true, email: true, name: true, referredById: true },
  });

  const inviterIds = Array.from(new Set(referredUsers.map(u => u.referredById!).filter(Boolean)));

  const inviters = await prisma.user.findMany({
    where: { id: { in: inviterIds } },
    select: { id: true, email: true, name: true, referralCode: true },
  });

  // Build groups
  const groups = inviters.map(inviter => ({
    inviter,
    referrals: referredUsers.filter(u => u.referredById === inviter.id),
  }));

  return res.status(200).json({ ok: true, count: groups.length, groups });
}
