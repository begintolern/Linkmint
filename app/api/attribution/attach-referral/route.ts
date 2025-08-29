// app/api/attribution/attach-referral/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function POST() {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;

  // must be logged in
  const email = session?.user?.email ?? null;
  const userId = (session?.user as any)?.id as string | undefined;
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // read cookie set by /r/[code]
  const ref = cookies().get("lm_ref")?.value?.trim();
  if (!ref) {
    return NextResponse.json({ success: false, error: "No referral cookie" }, { status: 400 });
  }

  // load current user
  const me =
    (userId &&
      (await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, referredById: true },
      }))) ||
    (await prisma.user.findUnique({
      where: { email },
      select: { id: true, referredById: true },
    }));

  if (!me) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  // do not overwrite if already attributed
  if (me.referredById) {
    return NextResponse.json({ success: true, message: "Already attributed" });
  }

  // resolve inviter from referralCode
  const inviter = await prisma.user.findUnique({
    where: { referralCode: ref },
    select: { id: true },
  });
  if (!inviter) {
    return NextResponse.json({ success: false, error: "Invalid referral code" }, { status: 400 });
  }

  // attach attribution
  await prisma.user.update({
    where: { id: me.id },
    data: { referredById: inviter.id },
  });

  return NextResponse.json({ success: true, message: "Attribution attached", inviterId: inviter.id });
}
