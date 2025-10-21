// app/api/admin/approve-commission/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Simple admin auth via header key */
function isAdmin(req: Request) {
  const k = (process.env.ADMIN_API_KEY || "").trim();
  const hdr = (req.headers.get("x-admin-key") || "").trim();
  return !!k && hdr === k;
}

export async function POST(req: Request) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, userId, status } = body as {
      id?: string;
      userId?: string;
      status?: "APPROVED" | "PENDING" | "PAID" | "UNVERIFIED";
    };

    // 1) Prefer approving a specific commission by ID (safest)
    if (id) {
      const exists = await prisma.commission.findUnique({ where: { id } });
      if (!exists) {
        return NextResponse.json({ ok: false, error: "Commission not found" }, { status: 404 });
      }
      if (exists.status !== "PENDING") {
        return NextResponse.json({ ok: false, error: `Commission not PENDING (is ${exists.status})` }, { status: 400 });
      }

      const updated = await prisma.commission.update({
        where: { id },
        data: {
          status: status || "APPROVED",
          finalizedAt: new Date(), // field that exists on your model
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ ok: true, message: "Commission approved by id.", commission: updated });
    }

    // 2) Otherwise, approve the most recent PENDING commission for a user
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Missing id or userId" }, { status: 400 });
    }

    const pending = await prisma.commission.findFirst({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!pending) {
      return NextResponse.json({ ok: false, error: "No pending commission found for user" }, { status: 404 });
    }

    const updated = await prisma.commission.update({
      where: { id: pending.id },
      data: {
        status: status || "APPROVED",
        finalizedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, message: "Commission approved (latest PENDING for user).", commission: updated });
  } catch (e: any) {
    console.error("[approve-commission] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
