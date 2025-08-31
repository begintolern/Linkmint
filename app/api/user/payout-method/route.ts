export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type MaybeSession = { user?: { id?: string | null } } | null;

function ok(data: any) {
  return NextResponse.json({ success: true, data });
}
function bad(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

// GET: return current default payout (from PayoutAccount)
export async function GET() {
  const session = (await getServerSession(authOptions)) as MaybeSession;
  const userId = session?.user?.id ?? null;
  if (!userId) return bad(401, "Unauthorized");

  // Read default payout account if present
  const acct = await prisma.payoutAccount.findFirst({
    where: { userId, isDefault: true },
    select: {
      provider: true,
      externalId: true, // we'll store the PayPal email here
      isDefault: true,
    },
  });

  if (!acct) return ok(null);

  return ok({
    provider: acct.provider,
    email: acct.externalId,
    label: "Default",
  });
}

// POST: save/set default payout (PayPal) into PayoutAccount
export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as MaybeSession;
  const userId = session?.user?.id ?? null;
  if (!userId) return bad(401, "Unauthorized");

  const body = await req.json().catch(() => ({} as any));
  const provider = (body as any)?.provider;
  const email = (body as any)?.email;

  if (provider !== "PAYPAL") return bad(400, "Provider must be PAYPAL");
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return bad(400, "Valid email required");
  }

  // Ensure only one default per user, and upsert a PAYPAL row using the compound unique
  // (userId, provider, externalId). externalId = email for PayPal.
  await prisma.$transaction(async (tx) => {
    // Clear any existing default
    await tx.payoutAccount.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Upsert by composite unique (userId, provider, externalId)
    await tx.payoutAccount.upsert({
      where: {
        // Assumes your Prisma model has @@unique([userId, provider, externalId])
        userId_provider_externalId: {
          userId,
          provider: "PAYPAL" as any,
          externalId: email,
        },
      },
      create: {
        userId,
        provider: "PAYPAL" as any,
        externalId: email,
        isDefault: true,
      },
      update: { isDefault: true },
    });
  });

  return NextResponse.json({ success: true });
}
