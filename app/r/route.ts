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
  const sid = url.searchParams.get("sid"); // user's referralCode

  if (!to) {
    return NextResponse.json({ ok: false, error: "Missing to" }, { status: 400 });
  }

  // Validate/normalize target
  let target: URL;
  try {
    target = assertHttpUrl(to);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Bad URL" }, { status: 400 });
  }

  // Log click best-effort; never block redirect
  try {
    // Find user by referralCode (sid)
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

  // Redirect to destination
  return NextResponse.redirect(target.toString(), { status: 302 });
}
