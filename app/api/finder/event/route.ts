// app/api/finder/event/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Body = {
  type:
    | "finder_open_product"
    | "finder_get_smartlink";
  item?: {
    id?: string;
    title?: string;
    merchant?: string;
    price?: number;
    url?: string;
  };
};

export async function POST(req: Request) {
  let body: Body | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.type) {
    return NextResponse.json({ ok: false, error: "Missing type" }, { status: 400 });
  }

  // Store a compact log row (non-blocking for the UI)
  try {
    await prisma.eventLog.create({
      data: {
        type: "finder",
        message: body.type,
        detail: JSON.stringify({
          item: body.item ?? null,
          ua: typeof navigator === "undefined" ? null : null, // server-side, ignore
          ts: Date.now(),
        }),
      },
    });
  } catch {
    // swallow — we don't want to break UX for logging issues
  }

  return NextResponse.json({ ok: true });
}
