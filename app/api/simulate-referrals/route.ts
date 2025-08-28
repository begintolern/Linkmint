/**
 * ⚠️ SIMULATOR ONLY — Developer testing route
 * Not used in production logic.
 * Safe to remove or disable before launch.
 */


// app/api/simulate-referrals/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

function randEmail(seed: string) {
  const n = Math.random().toString(36).slice(2, 8);
  return `ref-${seed}-${n}@example.test`;
}

export async function POST(req: Request) {
  try {
    const jwt = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    const email = (jwt as any)?.email as string | undefined;
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!me) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const created: Array<{ id: string; email: string }> = [];
    for (let i = 0; i < 3; i++) {
      const u = await prisma.user.create({
        data: {
          email: randEmail(String(i)),
          name: `Referred User ${i + 1}`,
          password: "dev-seed",
          referredById: me.id,
          emailVerifiedAt: new Date(),
        },
      });
      created.push({ id: u.id, email: u.email });
    }

    return NextResponse.json({ success: true, created });
  } catch (err) {
    console.error("simulate-referrals error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
