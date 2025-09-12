// app/api/smartlink/history/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/smartlink/history?merchantId=<id>&limit=20
export async function GET(req: Request) {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ links: [] }, { status: 200 });
  }

  const url = new URL(req.url);
  const merchantId = url.searchParams.get("merchantId");
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") ?? 20)));

  try {
    const links = await prisma.smartLink.findMany({
      where: {
        userId,
        ...(merchantId ? { merchantRuleId: merchantId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        merchantName: true,
        merchantDomain: true,
        merchantRuleId: true,
        originalUrl: true,
        shortUrl: true,
        label: true,
        createdAt: true,
      },
    });

    // serialize dates for JSON
    const out = links.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }));

    return NextResponse.json({ links: out });
  } catch (e) {
    console.error("[/api/smartlink/history] error:", e);
    return NextResponse.json({ links: [], error: "Failed to load history" }, { status: 500 });
  }
}
