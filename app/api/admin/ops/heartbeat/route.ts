// app/api/admin/ops/heartbeat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getOpsHealth } from "@/lib/ops/health";
import { sendOpsAlert } from "@/lib/ops/alerts";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  const adminId = process.env.ADMIN_USER_ID || "cmfbyhwog0000qi42l55ut0wi";

  if (!session?.user?.id || session.user.id !== adminId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const h = await getOpsHealth();
  const text = `[OPS Heartbeat — manual] db=${h.dbOk ? "ok" : "down"}, errors15m=${h.recentErrors}, payoutQueue=${h.payoutQueue}, autoPayout=${h.autoPayoutEnabled ?? "n/a"}, rssMB=${h.rssMB ?? "n/a"}, heapMB=${h.heapMB ?? "n/a"}`;
  const res = await sendOpsAlert(text);

  try {
    await (prisma as any).eventLog?.create?.({
      data: { type: "OPS_ALERT", severity: 1, message: "Manual heartbeat sent" },
    });
  } catch {}

  return NextResponse.json({ ok: true, res, health: h });
}
