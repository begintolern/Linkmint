// app/api/smartlink/history/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Pull recent links. No `select` so we can safely read unknown fields with `as any`.
    const links = (await prisma.smartLink.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    })) as any[];

    const payload = links.map((l) => {
      // Try common field names, fall back to nulls
      const url =
        l?.url ??
        l?.destination ??
        l?.destUrl ??
        l?.href ??
        null;

      const title =
        l?.title ??
        l?.name ??
        l?.label ??
        null;

      return {
        id: String(l?.id),
        title,
        url,
        createdAt:
          l?.createdAt?.toISOString?.() ??
          (typeof l?.createdAt === "string" ? l.createdAt : null),
      };
    });

    return NextResponse.json({ success: true, links: payload });
  } catch (e) {
    console.error("GET /api/smartlink/history error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
