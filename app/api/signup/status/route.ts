// app/api/signup/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// 🔎 version marker to confirm we're on the new build/route code
const VERSION = "status-v3";

// Read cap from either env (server or public)
const envCapPublic = process.env.NEXT_PUBLIC_SIGNUP_CAP;
const envCapServer = process.env.SIGNUP_CAP;
const SIGNUP_CAP = Number(envCapPublic ?? envCapServer ?? 100);

export async function GET() {
  try {
    let countedUsers = 0;
    try {
      countedUsers = await prisma.user.count({
        where: { NOT: { role: { in: ["ADMIN", "TEST"] as any } } } as any,
      });
    } catch {
      countedUsers = await prisma.user.count();
    }

    const remaining = Math.max(0, SIGNUP_CAP - countedUsers);

    return NextResponse.json({
      version: VERSION,
      open: remaining > 0,
      remaining,
      cap: SIGNUP_CAP,
      _debug: {
        envCapPublic,
        envCapServer,
        countedUsers,
        note: "remove _debug after verification",
      },
    });
  } catch {
    return NextResponse.json(
      {
        version: VERSION,
        open: true,
        remaining: SIGNUP_CAP,
        cap: SIGNUP_CAP,
        _debug: { envCapPublic, envCapServer, note: "fallback-no-db" },
      },
      { status: 200 }
    );
  }
}
