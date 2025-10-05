// app/api/payouts/me/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

function getUserIdFromReq(req: Request) {
  // Dev fallback: allow x-user-id header locally
  const hdr = req.headers.get("x-user-id");
  if (hdr) return hdr;

  // Normal: pull from cookies
  const jar = cookies();
  return (
    jar.get("uid")?.value ||
    jar.get("userId")?.value ||
    null
  );
}

export async function GET(req: Request) {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.payoutRequest.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
    take: 100,
    select: {
      id: true,
      amountPhp: true,
      method: true,
      status: true,
      requestedAt: true,
      processedAt: true,
      processorNote: true,
    },
  });

  return NextResponse.json({ ok: true, items });
}
