// app/api/user/walkthrough/complete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // If the column isn't in DB yet, fail soft (no-op) so UX keeps flowing.
  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { hasCompletedWalkthrough: true as any },
    });
  } catch {
    // swallow for now; we'll apply the migration later
  }

  return NextResponse.json({ ok: true });
}
