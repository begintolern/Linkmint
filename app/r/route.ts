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
  const sid = url.searchParams.get("sid"); // our referralCode (ascsubtag)

  if (!to) {
    return NextResponse.json({ ok: false, error: "Missing to" }, { status: 400 });
  }

  let target: URL;
  try {
    target = assertHttpUrl(to);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Bad URL" }, { status: 400 });
  }

  // Try to attribute the click to a user via referralCode = sid.
  // If DB write fails for any reason, we still redirect (logs are best-effort).
  try {
    const user = sid
      ? await prisma.user.findFirst({
          where: { referralCode: sid },
          select: { id: true, email: true },
        })
      : null;

    // EventLog schema varies per project; attempt a generic write and ignore failures.
    // If you have a ClickLog table, swap this out.
    if (user) {
      await prisma.eventLog.create({
        data: {
          userId: user.id,
          type: "CLICK",
          source: "smartlink",
          description: `Smart link click → ${target.hostname}`,
        } as any,
      });
    } else {
      // Write an unauthored click if your schema allows it (wrapped in try/catch)
      await prisma.eventLog.create({
        data: {
          type: "CLICK",
          source: "smartlink",
          description: `Smart link click (no user) → ${target.hostname}`,
        } as any,
      });
    }
  } catch (err) {
    // Don’t block redirect on logging error
    console.error("[/r] click log failed:", err);
  }

  // 302 to the destination
  return NextResponse.redirect(target.toString(), { status: 302 });
}
