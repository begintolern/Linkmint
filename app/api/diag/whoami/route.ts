// app/api/diag/whoami/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  const rawSession = await getServerSession(authOptions);
  const session = rawSession as Session | null;
  const email = session?.user?.email ?? "";

  let dbRole: string | null = null;
  if (email) {
    const me = await prisma.user.findUnique({
      where: { email },
      select: { role: true, id: true },
    });
    dbRole = (me?.role as any) ?? null;
  }

  return NextResponse.json({
    ok: true,
    email,
    sessionRole: (session?.user as any)?.role ?? null,
    dbRole,
    ts: new Date().toISOString(),
  });
}
