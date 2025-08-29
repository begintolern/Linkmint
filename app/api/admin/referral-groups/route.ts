export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;

  // Must be signed in
  const email = session?.user?.email ?? null;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Must be ADMIN
  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (me?.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // Return groups with basic user info
  const groups = await prisma.referralGroup.findMany({
    include: {
      users: {
        select: { id: true, email: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, count: groups.length, groups });
}
