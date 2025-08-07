// lib/getReferrerId.ts

import { prisma } from "@/lib/prisma";

export async function getReferrerIdByCode(code: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true },
  });

  return user?.id ?? null;
}
