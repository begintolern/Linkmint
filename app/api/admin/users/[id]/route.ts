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
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const { makeAdmin, makeUser, verifyEmail } = body as {
      makeAdmin?: boolean;
      makeUser?: boolean;
      verifyEmail?: boolean;
    };

    const data: any = {};
    const changes: string[] = [];
    if (makeAdmin) {
      data.role = "ADMIN";
      changes.push("role→ADMIN");
    }
    if (makeUser) {
      data.role = "USER";
      changes.push("role→USER");
    }
    if (verifyEmail) {
      data.emailVerifiedAt = new Date();
      changes.push("email verified");
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "No updates provided" }, { status: 400 });
    }

    // Update the target user
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, emailVerifiedAt: true, trustScore: true },
    });

    // Log the action (subject = updated user; actor = gate.userId/email if available)
    const actorId = (gate as any).userId ?? null;
    const actorEmail = (gate as any).email ?? "admin";
    const msg =
      `Admin ${actorEmail} updated user ${updated.email ?? updated.id}: ` +
      (changes.length ? changes.join(", ") : "no-op");

    try {
      await prisma.eventLog.create({
        data: {
          type: "trust",
          message: msg,
          // Log this against the SUBJECT user so filtering by user shows the change.
          userId: updated.id,
        } as any,
      });
    } catch (e) {
      // Non-blocking: don’t fail the request if logging fails
      console.warn("eventLog create failed:", e);
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
