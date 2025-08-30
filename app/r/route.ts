// app/r/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function assertHttpUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  return u;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to");
  // ✅ support ascsubtag as well as sid
  const sid = url.searchParams.get("sid") || url.searchParams.get("ascsubtag");

  if (!to) {
    return NextResponse.json({ ok: false, error: "Missing to" }, { status: 400 });
  }

  let target: URL;
  try {
    target = assertHttpUrl(to);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Bad URL" }, { status: 400 });
  }

  try {
    const user = sid
      ? await prisma.user.findUnique({
          where: { referralCode: sid },
          select: { id: true },
        })
      : null;

    await prisma.eventLog.create({
      data: {
        userId: user?.id ?? null,
        type: "CLICK",
        message: `Smart link click → ${target.hostname}`,
        detail: JSON.stringify({
          to: target.toString(),
          sid: sid ?? null,
          host: target.hostname,
          ts: new Date().toISOString(),
        }),
      },
    });
  } catch (err) {
    console.error("[/r] click log failed:", err);
  }

  return NextResponse.redirect(target.toString(), { status: 302 });
}
