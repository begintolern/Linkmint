// app/api/signup/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const SIGNUP_CAP = Number(process.env.NEXT_PUBLIC_SIGNUP_CAP ?? 100);

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
    return NextResponse.json({ open: remaining > 0, remaining, cap: SIGNUP_CAP });
  } catch {
    return NextResponse.json(
      { open: true, remaining: SIGNUP_CAP, cap: SIGNUP_CAP, note: "fallback-no-db" },
      { status: 200 }
    );
  }
}
