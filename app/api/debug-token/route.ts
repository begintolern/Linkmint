// app/api/debug-token/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await prisma.user.findFirst({
    where: {
      email: "epo78741@yahoo.com",
    },
  });

  return NextResponse.json({
    verifyToken: user?.verifyToken,
    verifyTokenExpiry: user?.verifyTokenExpiry,
    now: new Date(),
  });
}
