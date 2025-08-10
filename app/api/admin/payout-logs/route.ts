export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function checkAdminKey(req: Request) {
  const serverKey = process.env.ADMIN_KEY;
  if (!serverKey) {
    return NextResponse.json(
      { error: "Missing ADMIN_KEY on server. Set it in .env.local (dev) or Railway env (prod)." },
      { status: 500 }
    );
  }
  const headerKey = req.headers.get("x-admin-key");
  if (headerKey !== serverKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // ok
}

export async function GET(req: Request) {
  const authErr = checkAdminKey(req);
  if (authErr) return authErr;

  try {
    const logs = await prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching payout logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payout logs" },
      { status: 500 }
    );
  }
}
