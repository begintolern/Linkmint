// app/api/admin/users/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Gate: only admins
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const id = params.id;
    const body = await req.json().catch(() => ({} as any));

    const {
      makeAdmin,
      makeUser,
      verifyEmail,
      setTrust: setTrustRaw,
      bumpTrust: bumpTrustRaw,
      dropTrust: dropTrustRaw,
    } = (body ?? {}) as {
      makeAdmin?: boolean;
      makeUser?: boolean;
      verifyEmail?: boolean;
      setTrust?: number | string;
      bumpTrust?: number | string;
      dropTrust?: number | string;
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

    // Trust score handling with string/number coercion
    const setTrust = toNum(setTrustRaw);
    const bumpTrust = toNum(bumpTrustRaw);
    const dropTrust = toNum(dropTrustRaw);

    if (setTrust !== null || bumpTrust !== null || dropTrust !== null) {
      const cur = await prisma.user.findUnique({
        where: { id },
        select: { trustScore: true },
      });
      let next = cur?.trustScore ?? 0;

      if (setTrust !== null) {
        next = setTrust;
        changes.push(`trust=set(${setTrust})`);
      } else {
        if (bumpTrust !== null) {
          next += bumpTrust;
          changes.push(`trust+=${bumpTrust}`);
        }
        if (dropTrust !== null) {
          next -= dropTrust;
          changes.push(`trust-=${dropTrust}`);
        }
      }
      data.trustScore = next;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "No updates provided" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, emailVerifiedAt: true, trustScore: true },
    });

    // Log the action
    const actorEmail = (gate as any).email ?? "admin";
    const msg =
      `Admin ${actorEmail} updated user ${updated.email ?? updated.id}: ` +
      (changes.length ? changes.join(", ") : "no-op");

    try {
      await prisma.eventLog.create({
        data: {
          type: "trust",
          message: msg,
          userId: updated.id, // subject user
        } as any,
      });
    } catch (e) {
      console.warn("eventLog create failed:", e);
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
