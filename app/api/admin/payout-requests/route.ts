import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const rows = await prisma.payoutRequest.findMany({
    orderBy: { requestedAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({ ok: true, items: rows });
}
