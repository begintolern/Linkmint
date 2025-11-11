import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type Ok = { ok: true; links?: any[] };
type Err = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  // NextAuth session (typed as any to avoid TS narrowing to `{}`)
  const session = (await getServerSession(req, res, authOptions)) as any;
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
  }

  if (req.method === "GET") {
    // Return recent links for the signed-in user (kept minimal for safety)
    const links = await prisma.smartLink.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        shortUrl: true,
        originalUrl: true,
        merchantName: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ ok: true, links });
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` });
}
