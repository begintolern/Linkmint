// app/api/debug/log-click-test/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * GET /api/debug/log-click-test?smartLinkId=TEST123
 * Auth required. Writes a test CLICK log row and returns the DB result or error details.
 */
export async function GET(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  const userId: string | undefined = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const smartLinkId = url.searchParams.get("smartLinkId") || "TEST123";

  const detailPayload = {
    smartLinkId,
    merchantRuleId: null,
    merchantName: "Debug Merchant",
    merchantDomain: "debug.example",
    outboundUrl: `https://debug.example/?lm_subid=${smartLinkId}`,
    ip: "127.0.0.1",
    ua: "debug",
    referer: null,
    at: new Date().toISOString(),
  };

  try {
    const row = await prisma.eventLog.create({
      data: {
        // IMPORTANT: your EventLog has a relation 'user' (not scalar userId)
        user: { connect: { id: userId } },
        type: "CLICK",
        message: "SmartLink click (debug)",
        detail: JSON.stringify(detailPayload), // <-- store JSON as string
      },
    });

    return NextResponse.json({ ok: true, row });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "DB_WRITE_FAILED", message: e?.message, meta: e },
      { status: 500 }
    );
  }
}
