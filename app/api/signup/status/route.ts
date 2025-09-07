// app/api/signup/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SIGNUP_CAP = 100;

export async function GET() {
  // Simple count for now (we’ll exclude test/admin in a later step)
  const totalUsers = await prisma.user.count();
  const remaining = Math.max(0, SIGNUP_CAP - totalUsers);
  return NextResponse.json({
    open: remaining > 0,
    remaining,
    cap: SIGNUP_CAP,
  });
}
