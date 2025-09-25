// app/api/smartlink/route.backup.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Avoid strict selects so this won't break if the model doesn't have url/title.
    const links = (await prisma.smartLink.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })) as any[];

    const out = links.map((l) => {
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

    return NextResponse.json({ success: true, links: out });
  } catch (e) {
    console.error("GET /api/smartlink (backup) error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
