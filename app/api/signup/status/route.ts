// app/api/signup/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";   // ✅ do not prerender at build
export const revalidate = 0;               // ✅ no ISR
export const fetchCache = "force-no-store";

const SIGNUP_CAP = 100;

export async function GET() {
  try {
    // Count only real users for now (we'll exclude admins/tests in a later step)
    const totalUsers = await prisma.user.count();
    const remaining = Math.max(0, SIGNUP_CAP - totalUsers);
    return NextResponse.json({
      open: remaining > 0,
      remaining,
      cap: SIGNUP_CAP,
    });
  } catch (err) {
    // ✅ If DATABASE_URL is missing at build, return a safe default instead of crashing
    return NextResponse.json(
      { open: true, remaining: SIGNUP_CAP, cap: SIGNUP_CAP, note: "fallback-no-db" },
      { status: 200 }
    );
  }
}