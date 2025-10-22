// app/api/user/walkthrough/complete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST() {
  // Tolerant extraction in case Session type is `{}` at compile time
  const session = await getServerSession(authOptions as any);
  const email =
    (session as any)?.user?.email ??
    (typeof session === "object" && session && "user" in (session as any)
      ? (session as any).user?.email
      : undefined);

  if (!email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // If the column isn't migrated yet, fail-soft so UX continues
  try {
    await prisma.user.update({
      where: { email },
      data: { hasCompletedWalkthrough: true as any },
    });
  } catch {
    // swallow until DB migration is applied
  }

  return NextResponse.json({ ok: true });
}
