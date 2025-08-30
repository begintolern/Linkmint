// app/api/admin/referral-groups/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

// Narrow the session type so TS knows `user` exists.
type AdminSession = Session & {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string | null;
  };
};

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as AdminSession | null;

    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = session?.user?.role ?? "USER";
    if (role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.referralGroup.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        referrer: { select: { id: true, email: true, name: true } },
        users: { select: { id: true, email: true, name: true } },
        _count: { select: { users: true } },
      },
    });

    return NextResponse.json({ success: true, rows });
  } catch (err: any) {
    console.error("[admin/referral-groups] GET failed:", err?.message || err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
