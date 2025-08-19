// app/api/admin/users/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/index"; // wrapper that calls getServerSession(authOptions)

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(session as any).user?.id) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // Optional role gate
    const role = (session as any).user?.role ?? "USER";
    if (role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true, // ✅ timestamp field
        createdAt: true,
        role: true,
      },
    });

    // Normalize for UI (keep both keys if you want)
    const data = users.map(u => ({
      ...u,
      emailVerified: !!u.emailVerifiedAt, // for components expecting boolean
    }));

    return NextResponse.json({ ok: true, users: data });
  } catch (err) {
    console.error("[admin/users] error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
