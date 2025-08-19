// app/api/session/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth/next"; // ✅ runtime
import type { Session } from "next-auth";          // ✅ types
import { authOptions } from "@/lib/auth/options";
import { NextResponse } from "next/server";

export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  // Return a minimal, safe snapshot of the session
  return NextResponse.json({
    authenticated: true,
    user: {
      id: (session.user as any).id ?? null,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      role: (session.user as any).role ?? "USER",
    },
  });
}
