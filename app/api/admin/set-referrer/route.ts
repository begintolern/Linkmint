// app/api/admin/set-referrer/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function isAdmin(req: Request) {
  const cookie = (req.headers.get("cookie") || "");
  const hdr = (req.headers.get("x-admin-key") || "").trim();
  const adminKey = (process.env.ADMIN_API_KEY || "").trim();
  const hasCookie = cookie.includes(`admin_key=${adminKey}`);
  return adminKey ? (hasCookie || hdr === adminKey) : true; // allow in dev if no key
}

export async function POST(req: Request) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as
      | { childEmail?: string; childId?: string; referrerEmail?: string; referrerId?: string }
      | null;

    if (!body) {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    // Resolve child
    let child = null as null | { id: string; email: string | null };
    if (body.childId) {
      child = await prisma.user.findUnique({ where: { id: body.childId }, select: { id: true, email: true } });
    } else if (body.childEmail) {
      child = await prisma.user.findUnique({ where: { email: body.childEmail }, select: { id: true, email: true } });
    }
    if (!child) return NextResponse.json({ ok: false, error: "Child user not found" }, { status: 404 });

    // Resolve referrer
    let ref = null as null | { id: string; email: string | null };
    if (body.referrerId) {
      ref = await prisma.user.findUnique({ where: { id: body.referrerId }, select: { id: true, email: true } });
    } else if (body.referrerEmail) {
      ref = await prisma.user.findUnique({ where: { email: body.referrerEmail }, select: { id: true, email: true } });
    }
    if (!ref) return NextResponse.json({ ok: false, error: "Referrer user not found" }, { status: 404 });

    // Update referral
    const updated = await prisma.user.update({
      where: { id: child.id },
      data: { referredById: ref.id },
      select: { id: true, email: true, referredById: true },
    });

    return NextResponse.json({
      ok: true,
      message: "Referrer set",
      child: updated,
      referrer: ref,
    });
  } catch (e: any) {
    console.error("[admin/set-referrer] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
