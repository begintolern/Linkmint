// app/api/user/walkthrough/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // TEMP SAFE DEFAULT while DB column may not exist yet
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { hasCompletedWalkthrough: true as any },
    });

    return NextResponse.json({
      ok: true,
      hasCompletedWalkthrough: !!user?.hasCompletedWalkthrough,
    });
  } catch {
    // If column isn't applied yet, default to "not completed"
    return NextResponse.json({ ok: true, hasCompletedWalkthrough: false });
  }
}
