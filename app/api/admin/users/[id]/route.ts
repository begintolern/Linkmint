// app/api/admin/users/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Gate: only admins
  const gate = await adminGuard();
  if (!gate.ok) return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });

  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const { makeAdmin, makeUser, verifyEmail } = body as {
      makeAdmin?: boolean;
      makeUser?: boolean;
      verifyEmail?: boolean;
    };

    const data: any = {};
    if (makeAdmin) data.role = "ADMIN";
    if (makeUser) data.role = "user";
    if (verifyEmail) data.emailVerifiedAt = new Date();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "No updates provided" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, emailVerifiedAt: true, trustScore: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
