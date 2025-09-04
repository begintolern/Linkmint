// app/api/admin/users/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuardFromReq } from "@/lib/utils/adminGuardReq";

type Body = Partial<{
  verifyEmail: boolean;
  makeAdmin: boolean;
  makeUser: boolean;
  bumpTrust: number; // positive int
  dropTrust: number; // positive int
}>;

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const gate = await adminGuardFromReq(req);
  if (!gate.ok) return gate.res;

  const id = ctx.params.id;

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    // allow empty body
  }

  const updates: any = {};
  const now = new Date();

  // Actions
  if (body.verifyEmail) {
    updates.emailVerifiedAt = now;
  }

  if (body.makeAdmin) {
    updates.role = "ADMIN";
  }

  if (body.makeUser) {
    updates.role = "USER";
  }

  if (typeof body.bumpTrust === "number" && Number.isFinite(body.bumpTrust) && body.bumpTrust > 0) {
    // Use atomic increment
    updates.trustScore = { increment: Math.trunc(body.bumpTrust) };
  }

  if (typeof body.dropTrust === "number" && Number.isFinite(body.dropTrust) && body.dropTrust > 0) {
    // Use atomic decrement
    updates.trustScore = {
      // if both bump and drop are present, they’ll override each other; keep it simple here
      decrement: Math.trunc(body.dropTrust),
    };
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, error: "No valid action" }, { status: 400 });
  }

  // Update
  const user = await prisma.user.update({
    where: { id },
    data: updates,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      trustScore: true,
      createdAt: true,
      emailVerifiedAt: true,
    },
  });

  // Audit log
  await prisma.eventLog.create({
    data: {
      userId: id,
      type: "admin",
      message: `Admin updated user ${id}`,
      detail: JSON.stringify({ updates }),
    },
  });

  // Serialize dates
  const out = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
  };

  return NextResponse.json({ success: true, user: out });
}
