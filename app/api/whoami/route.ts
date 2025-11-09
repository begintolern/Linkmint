// app/api/whoami/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

const ADMINS = (process.env.ADMINS ??
  "epo78741@yahoo.com,admin@linkmint.co,ertorig3@gmail.com")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "NO_SESSION" }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, role: true, disabled: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 200 });
    }
    if (user.disabled) {
      return NextResponse.json({ ok: false, error: "USER_DISABLED" }, { status: 200 });
    }

    const isAdmin = ADMINS.includes(user.email ?? "");

    // Backward compatible fields (email, admins, isAdmin) + the normalized `user` object
    return NextResponse.json({
      ok: true,
      email: user.email ?? null,
      admins: ADMINS,
      isAdmin,
      user, // { id, email, name, role, disabled }
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
