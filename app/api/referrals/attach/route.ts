// app/api/referrals/attach/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

async function attach(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const refFromQuery = searchParams.get("ref")?.trim();
  const refFromCookie = req.cookies.get("lm_ref")?.value?.trim();
  const ref = refFromQuery || refFromCookie;

  if (!ref) {
    return NextResponse.json({ ok: false, error: "Missing ref code" }, { status: 400 });
  }

  const me = await prisma.user.findUnique({
    where: { email: token.email },
    select: { id: true, email: true, referredById: true },
  });
  if (!me) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const inviter = await prisma.user.findFirst({
    where: { referralCode: ref },
    select: { id: true, email: true },
  });
  if (!inviter) {
    return NextResponse.json({ ok: false, error: "Inviter not found for ref" }, { status: 404 });
  }

  if (inviter.id === me.id) {
    return NextResponse.json({ ok: false, error: "Cannot self-refer" }, { status: 400 });
  }

  let updated = false;
  if (!me.referredById) {
    await prisma.user.update({
      where: { id: me.id },
      data: { referredById: inviter.id },
    });
    updated = true;
  }

  const res = NextResponse.json({
    ok: true,
    attached: updated,
    alreadySet: !updated,
    user: me.email,
    inviter: inviter.email,
    ref,
  });
  if (refFromCookie) {
    res.cookies.set("lm_ref", "", { path: "/", maxAge: 0 });
  }
  return res;
}

export async function GET(req: NextRequest) {
  return attach(req);
}

export async function POST(req: NextRequest) {
  return attach(req);
}
