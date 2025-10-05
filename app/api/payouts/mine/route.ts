import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TEMP auth (same scheme as before: header or cookie)
function getUserId(req: Request): string | null {
  const h = req.headers.get("x-user-id");
  if (h && h.trim()) return h.trim();
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;)\s*userId=([^;]+)/);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.payoutRequest.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
    select: {
      id: true,
      amountPhp: true,
      method: true,
      status: true,
      requestedAt: true,
      processedAt: true,
      processorNote: true,
    }
  });

  return NextResponse.json({ ok: true, items: rows });
}
