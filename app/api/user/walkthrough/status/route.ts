// app/api/user/walkthrough/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  // Some codebases have strict/custom Session types; use a safe extraction.
  const session = await getServerSession(authOptions as any);
  const email =
    (session as any)?.user?.email ??
    (typeof session === "object" && session && "user" in session
      ? (session as any).user?.email
      : undefined);

  if (!email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      // If the column isn't migrated yet, this keeps TS quiet; runtime falls back below.
      select: { hasCompletedWalkthrough: true as any },
    });

    return NextResponse.json({
      ok: true,
      hasCompletedWalkthrough: !!user?.hasCompletedWalkthrough,
    });
  } catch {
    // Column may not exist yet → default to "not completed"
    return NextResponse.json({ ok: true, hasCompletedWalkthrough: false });
  }
}
