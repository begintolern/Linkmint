import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type SafeLink = {
  id: string;
  shortUrl: string | null;
  merchantName: string | null;
  originalUrl: string | null;
  destinationUrl: string | null; // derived
  createdAt: string;             // ISO
  clicks: number;
};

function deriveDestination(destinationsJson: unknown, fallback: string | null) {
  try {
    const val =
      typeof destinationsJson === "string"
        ? JSON.parse(destinationsJson)
        : destinationsJson;
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0] as any;
      if (first && typeof first.url === "string" && first.url.length > 0) {
        return first.url;
      }
    }
  } catch {}
  return fallback ?? null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
  }

  const rows = await prisma.smartLink.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      shortUrl: true,
      originalUrl: true,
      merchantName: true,
      destinationsJson: true,
      createdAt: true,
      _count: { select: { clicks: true } },
    },
    take: 50,
  });

  const links: SafeLink[] = rows.map((r) => ({
    id: r.id,
    shortUrl: r.shortUrl ?? null,
    merchantName: r.merchantName ?? null,
    originalUrl: r.originalUrl ?? null,
    destinationUrl: deriveDestination(r.destinationsJson as any, r.originalUrl ?? null),
    createdAt: r.createdAt.toISOString(),
    clicks: r._count?.clicks ?? 0,
  }));

  return res.status(200).json({ ok: true, links });
}
