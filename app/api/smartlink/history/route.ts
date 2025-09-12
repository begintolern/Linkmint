// app/api/smartlink/history/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/smartlink/history?merchantId=<id>&limit=20
export async function GET(req: NextRequest) {
  // Try session first
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  let userId = (session?.user as any)?.id as string | undefined;

  // Fallback to JWT if session not present
  if (!userId) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    userId = (token as any)?.sub || (token as any)?.id;
  }

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

    const out = links.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }));
    return NextResponse.json({ links: out });
  } catch (e) {
    console.error("[/api/smartlink/history] error:", e);
    return NextResponse.json({ links: [], error: "Failed to load history" }, { status: 500 });
  }
}
