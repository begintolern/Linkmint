// app/api/ops/dev-create-user/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

/**
 * POST /api/ops/dev-create-user
 * Body: { email: string, name?: string, referredById?: string|null }
 */
export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const name = body?.name ? String(body.name) : null;
    const referredById = body?.referredById ?? null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "email_required" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        referredById, // null or a user id; leaving null means NO referral window
      },
      select: { id: true, email: true, name: true, referredById: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "unknown_error" }, { status: 400 });
  }
}
