// app/api/admin/users/freeze/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

function isHeaderAuthorized(req: Request) {
  const headerKey = req.headers.get("x-admin-key") || "";
  const envKey = process.env.ADMIN_API_KEY || "";
  return !!envKey && headerKey === envKey;
}

export async function POST(req: Request) {
  try {
    // Allow either: (A) logged-in admin session OR (B) x-admin-key header
    let authorized = false;

    // A) session admin
    try {
      const session = (await getServerSession(authOptions as any)) as any;
      if (session?.user?.role === "admin") authorized = true;
    } catch {
      // ignore
    }

    // B) maintenance header
    if (!authorized && isHeaderAuthorized(req)) authorized = true;

    if (!authorized) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetId: string | undefined = body.userId || body.targetId;

    if (!targetId) {
      return NextResponse.json(
        { ok: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { disabled: true, trustScore: 0 },
      select: { id: true, email: true, name: true, disabled: true, trustScore: true },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    console.error("[/api/admin/users/freeze] error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
