export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

// A minimal session shape so TS won't complain
type MaybeSession = { user?: { id?: string | null } } | null;

// GET: return current default payout (PayPal email)
export async function GET() {
  const session = (await getServerSession(authOptions)) as MaybeSession;
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Tolerate projects without typed field using `as any`
  const user = await prisma.user.findUnique(
    { where: { id: userId }, select: { paypalEmail: true } as any } as any
  );
  const email = (user as any)?.paypalEmail ?? null;

  return NextResponse.json({
    success: true,
    data: email ? { provider: "PAYPAL", email, label: "Default" } : null,
  });
}

// POST: save/set default payout (PayPal email)
export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as MaybeSession;
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const provider = (body as any)?.provider;
  const email = (body as any)?.email;

  if (provider !== "PAYPAL") {
    return NextResponse.json({ success: false, error: "Provider must be PAYPAL" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ success: false, error: "Valid email required" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { paypalEmail: email } as any, // tolerate schema without typed field
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[payout-method][POST]", err);
    return NextResponse.json(
      { success: false, error: "paypalEmail field missing on User" },
      { status: 500 }
    );
  }
}
