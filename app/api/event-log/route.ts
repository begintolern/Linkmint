// app/api/event-log/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = {
      type: String(body?.type || "unknown"),
      merchantId: String(body?.merchantId || ""),
      merchantName: String(body?.merchantName || ""),
      merchantDomain: body?.merchantDomain ? String(body.merchantDomain) : null,
      ts: new Date(body?.ts ? Number(body.ts) : Date.now()),
    };

    // Try to persist if EventLog model exists; otherwise no-op
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyPrisma = prisma as any;
      if (anyPrisma?.eventLog?.create) {
        await anyPrisma.eventLog.create({
          data: {
            type: payload.type,
            merchantId: payload.merchantId,
            merchantName: payload.merchantName,
            merchantDomain: payload.merchantDomain,
            occurredAt: payload.ts, // adjust to your column name
            raw: payload,           // if you have a Json column
          },
        });
      }
    } catch (e) {
      // swallow if model/columns differ; we still return 200
      console.warn("[event-log] persistence skipped:", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
}
