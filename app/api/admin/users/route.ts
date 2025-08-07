export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  // Admin-only access
  if (!session || session.user.id !== "cmdul8d7c0003wn10f0h71u29") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}


  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      trustScore: true,
      referralGroupId: true,
      referredById: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
