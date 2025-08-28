/**
 * ⚠️ SIMULATOR ONLY — Developer testing route
 * Not used in production logic.
 * Safe to remove or disable before launch.
 */


// app/api/simulate-approve/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

/** ⚠️ SIMULATOR ONLY — test route */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

type Body = { id?: string; email?: string };

export async function POST(req: Request) {
  try {
    const jwt = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);
    let email = (jwt as any)?.email as string | undefined;

    let body: Body = {};
    try { body = await req.json(); } catch {}
    if (!email && body.email) email = body.email.trim().toLowerCase();
    if (!email) return NextResponse.json({ success:false, error:"Unauthorized" }, { status:401 });

    const me = await prisma.user.findUnique({ where:{ email }, select:{ id:true }});
    if (!me) return NextResponse.json({ success:false, error:"User not found" }, { status:404 });

    let targetId = body.id ?? null;
    if (!targetId) {
      const latest = await prisma.commission.findFirst({
        where:{ userId: me.id, status: "PENDING" },
        orderBy:{ createdAt: "desc" }, select:{ id:true }
      });
      if (!latest) return NextResponse.json({ success:false, error:"No pending commissions" }, { status:400 });
      targetId = latest.id;
    }

    const own = await prisma.commission.findFirst({ where:{ id: targetId, userId: me.id }, select:{ id:true }});
    if (!own) return NextResponse.json({ success:false, error:"Commission not found for this user" }, { status:404 });

    const updated = await prisma.commission.update({ where:{ id: targetId }, data:{ status:"APPROVED" }, select:{ id:true, status:true }});
    return NextResponse.json({ success:true, updated });
  } catch (e:any) {
    return NextResponse.json({ success:false, error: e?.message ?? "Server error" }, { status:500 });
  }
}

