// app/api/diag/find-user/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const rawSession = await getServerSession(authOptions);
  const session = rawSession as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim();

  if (!email) {
    return NextResponse.json({ ok: false, error: "Missing ?email=" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found", email }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user });
}
