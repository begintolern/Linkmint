// app/api/signup/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const SIGNUP_CAP = 100;

export async function GET() {
  try {
    // Prefer role-based counting; falls back to total if role isn't present
    let countedUsers = 0;

    try {
      // If your Prisma schema has a Role enum/role field:
      countedUsers = await prisma.user.count({
        where: {
          // Count only real users
          // If your roles are strings, this still works; if role doesn't exist, inner try will throw
          NOT: { role: { in: ["ADMIN", "TEST"] as any } },
        } as any,
      });
    } catch {
      // Fallback: role field not found — just count everyone
      countedUsers = await prisma.user.count();
    }

    const remaining = Math.max(0, SIGNUP_CAP - countedUsers);
    return NextResponse.json({
      open: remaining > 0,
      remaining,
      cap: SIGNUP_CAP,
    });
  } catch {
    // Safe fallback if DB/env not available during build
    return NextResponse.json(
      { open: true, remaining: SIGNUP_CAP, cap: SIGNUP_CAP, note: "fallback-no-db" },
      { status: 200 }
    );
  }
}
