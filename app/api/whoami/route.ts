// app/api/whoami/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  const session = (await getServerSession(authOptions)) as any;
  const email = session?.user?.email ?? null;

  const adminsEnv = process.env.ADMIN_EMAILS || "";
  const admins = adminsEnv
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  return NextResponse.json({
    ok: true,
    email,
    admins,
    isAdmin: email ? admins.includes(String(email).toLowerCase()) : false,
  });
}
