// app/api/smartlink/history/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  let userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    userId = (token as any)?.sub || (token as any)?.id;
  }
  if (!userId) return NextResponse.json({ links: [] });

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(20, Number(url.searchParams.get("limit") ?? 10)));
  const cursor = url.searchParams.get("cursor") || undefined;

  const links = await prisma.smartLink.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1, // fetch one extra to know if next page exists
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      merchantName: true,
      originalUrl: true,
      shortUrl: true,
      createdAt: true,
    },
  });

  let nextCursor: string | null = null;
  if (links.length > limit) {
    const nextItem = links.pop();
    nextCursor = nextItem?.id ?? null;
  }

  return NextResponse.json({
    links: links.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    nextCursor,
  });
}
