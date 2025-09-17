// app/api/merchant-rules/[id]/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// If you already have GET/DELETE here, just ADD this PATCH export below them.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await req.json().catch(() => ({} as any));
  const status = body?.status as "PENDING" | "ACTIVE" | "REJECTED" | undefined;

  if (!status || !["PENDING", "ACTIVE", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.merchantRule.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      status: true,
    },
  });

  return NextResponse.json(updated);
}
