// app/api/user/update/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { PayoutProvider } from "@prisma/client";

type Body = {
  name?: string | null;
  paypalEmail?: string | null;
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Update display name if provided
    if (typeof body.name === "string") {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: body.name.trim() || null },
      });
    }

    // Upsert PayPal payout email if provided
    if (typeof body.paypalEmail === "string") {
      const val = body.paypalEmail.trim();
      if (val && !isEmail(val)) {
        return NextResponse.json({ ok: false, error: "Invalid PayPal email." }, { status: 400 });
      }

      if (val) {
        const existing = await prisma.payoutAccount.findFirst({
          where: { userId: user.id, provider: PayoutProvider.PAYPAL },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });

        if (existing) {
          await prisma.payoutAccount.update({
            where: { id: existing.id },
            data: {
              externalId: val,
              isDefault: true,
              status: "VERIFIED",
              label: "PayPal",
            },
          });
        } else {
          await prisma.payoutAccount.create({
            data: {
              userId: user.id,
              provider: PayoutProvider.PAYPAL,
              externalId: val,
              isDefault: true,
              status: "VERIFIED",
              label: "PayPal",
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/user/update] error:", e);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
