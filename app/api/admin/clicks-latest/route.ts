// app/api/admin/clicks-latest/route.ts
import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function isAdmin() {
  const k = (process.env.ADMIN_API_KEY || "").trim();
  const jar = cookies();
  const h = headers();
  const cookieKey = (jar.get("admin_key")?.value || "").trim();
  const headerKey = (h.get("x-admin-key") || "").trim();
  return !!k && (cookieKey === k || headerKey === k);
}

export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.clickEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      source: true,
      linkId: true,
      url: true,
      referer: true,
      ip: true,
      userAgent: true,
    },
  });

  return NextResponse.json({ ok: true, rows });
}
