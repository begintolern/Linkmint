// app/api/verify-email/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Token missing" },
      { status: 400 }
    );
  }

  // ✅ Use raw SQL with type casting to avoid Prisma case mismatch issues
  const users = await prisma.$queryRawUnsafe<
    { id: string; email: string }[]
  >(
    `
    SELECT id, email FROM "User"
    WHERE "verifyToken" = '${token}'
    AND "verifyTokenExpiry" > NOW()
    LIMIT 1
    `
  );

  const user = users[0];

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 400 }
    );
  }

  // ✅ Clear verification token and mark user verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verifyToken: null,
      verifyTokenExpiry: null,
    },
  });

  return NextResponse.json({ success: true });
}
